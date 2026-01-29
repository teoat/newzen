"""
Currency Converter Service
Handles multi-currency conversions for transaction matching
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional
from decimal import Decimal
import json

class CurrencyConverter:
    """
    Handles currency conversions with caching
    Uses exchangerate-api.com as primary source
    Fallback to manual rates if API unavailable
    """
    
    def __init__(self, api_key: Optional[str] = None, base_currency: str = "USD"):
        self.api_key = api_key or os.getenv("EXCHANGE_RATE_API_KEY")
        self.base_currency = base_currency
        self.cache: Dict[str, Dict] = {}
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        # Fallback rates (updated periodically)
        self.fallback_rates = {
            "USD": 1.0,
            "IDR": 15750.0,  # Indonesian Rupiah
            "EUR": 0.92,
            "GBP": 0.79,
            "JPY": 149.50,
            "CNY": 7.24,
            "SGD": 1.34,
            "MYR": 4.72,
            "THB": 35.80,
            "PHP": 56.25,
        }
    
    def _get_cache_key(self, from_currency: str, to_currency: str, date: Optional[datetime] = None) -> str:
        """Generate cache key for rate lookup"""
        date_str = date.strftime("%Y-%m-%d") if date else datetime.now().strftime("%Y-%m-%d")
        return f"{from_currency}_{to_currency}_{date_str}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached rate is still valid"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key].get("cached_at")
        if not cached_time:
            return False
        
        return datetime.now() - cached_time < self.cache_duration
    
    def get_exchange_rate(
        self, 
        from_currency: str, 
        to_currency: str, 
        date: Optional[datetime] = None
    ) -> float:
        """
        Get exchange rate from one currency to another
        
        Args:
            from_currency: Source currency code (e.g., "USD")
            to_currency: Target currency code (e.g., "IDR")
            date: Optional date for historical rates
        
        Returns:
            Exchange rate as float
        """
        # Same currency
        if from_currency == to_currency:
            return 1.0
        
        # Check cache
        cache_key = self._get_cache_key(from_currency, to_currency, date)
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]["rate"]
        
        # Try API
        rate = self._fetch_from_api(from_currency, to_currency, date)
        
        # Fallback to manual rates
        if rate is None:
            rate = self._get_fallback_rate(from_currency, to_currency)
        
        # Cache the result
        self.cache[cache_key] = {
            "rate": rate,
            "cached_at": datetime.now()
        }
        
        return rate
    
    def _fetch_from_api(
        self, 
        from_currency: str, 
        to_currency: str, 
        date: Optional[datetime] = None
    ) -> Optional[float]:
        """Fetch rate from API"""
        if not self.api_key:
            return None
        
        try:
            # Use free exchangerate-api.com
            url = f"https://v6.exchangerate-api.com/v6/{self.api_key}/pair/{from_currency}/{to_currency}"
            
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("result") == "success":
                    return float(data.get("conversion_rate", 0))
            
            return None
        except Exception as e:
            print(f"API fetch failed: {e}")
            return None
    
    def _get_fallback_rate(self, from_currency: str, to_currency: str) -> float:
        """Get rate from fallback table (relative to USD)"""
        if from_currency not in self.fallback_rates or to_currency not in self.fallback_rates:
            raise ValueError(f"Unsupported currency pair: {from_currency}/{to_currency}")
        
        # Convert through USD
        from_usd_rate = self.fallback_rates[from_currency]
        to_usd_rate = self.fallback_rates[to_currency]
        
        return to_usd_rate / from_usd_rate
    
    def convert(
        self, 
        amount: float, 
        from_currency: str, 
        to_currency: str, 
        date: Optional[datetime] = None
    ) -> Decimal:
        """
        Convert amount from one currency to another
        
        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency
            date: Optional date for historical rate
        
        Returns:
            Converted amount as Decimal
        """
        rate = self.get_exchange_rate(from_currency, to_currency, date)
        converted = Decimal(str(amount)) * Decimal(str(rate))
        
        # Round to 2 decimal places
        return converted.quantize(Decimal('0.01'))
    
    def normalize_to_base(
        self, 
        amount: float, 
        currency: str, 
        date: Optional[datetime] = None
    ) -> Decimal:
        """
        Normalize amount to base currency (USD by default)
        
        Args:
            amount: Amount to normalize
            currency: Source currency
            date: Optional date
        
        Returns:
            Amount in base currency
        """
        return self.convert(amount, currency, self.base_currency, date)
    
    def get_supported_currencies(self) -> list:
        """Get list of supported currencies"""
        return list(self.fallback_rates.keys())
    
    def update_fallback_rates(self, rates: Dict[str, float]):
        """Update fallback rates manually"""
        self.fallback_rates.update(rates)
    
    def clear_cache(self):
        """Clear the rate cache"""
        self.cache.clear()


# Global instance
_converter: Optional[CurrencyConverter] = None


def get_currency_converter() -> CurrencyConverter:
    """Get or create global currency converter instance"""
    global _converter
    if _converter is None:
        _converter = CurrencyConverter()
    return _converter
