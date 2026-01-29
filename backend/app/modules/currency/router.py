"""
Currency API Router
Provides multi-currency conversion and exchange rate endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.core.currency_converter import get_currency_converter

router = APIRouter(prefix="/api/v1/currency", tags=["Currency"])


class CurrencyConvertRequest(BaseModel):
    """Request model for currency conversion"""
    amount: float = Field(..., description="Amount to convert")
    from_currency: str = Field(..., description="Source currency code (e.g., USD)")
    to_currency: str = Field(..., description="Target currency code (e.g., IDR)")
    date: Optional[str] = Field(None, description="Optional date for historical rate (YYYY-MM-DD)")


class CurrencyConvertResponse(BaseModel):
    """Response model for currency conversion"""
    converted_amount: float
    rate: float
    from_currency: str
    to_currency: str
    date: str


class ExchangeRatesResponse(BaseModel):
    """Response model for exchange rates"""
    base_currency: str
    rates: dict
    last_updated: str


@router.post("/convert", response_model=CurrencyConvertResponse)
async def convert_currency(request: CurrencyConvertRequest):
    """
    Convert amount from one currency to another
    
    Args:
        request: Conversion request with amount and currencies
    
    Returns:
        Converted amount and exchange rate
    """
    try:
        converter = get_currency_converter()
        
        # Parse date if provided
        date_obj = None
        if request.date:
            try:
                date_obj = datetime.strptime(request.date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Get exchange rate
        rate = converter.get_exchange_rate(
            request.from_currency,
            request.to_currency,
            date_obj
        )
        
        # Convert amount
        converted = converter.convert(
            request.amount,
            request.from_currency,
            request.to_currency,
            date_obj
        )
        
        return CurrencyConvertResponse(
            converted_amount=float(converted),
            rate=rate,
            from_currency=request.from_currency,
            to_currency=request.to_currency,
            date=request.date or datetime.now().strftime("%Y-%m-%d")
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.get("/rates", response_model=ExchangeRatesResponse)
async def get_exchange_rates(
    base: str = Query("USD", description="Base currency code")
):
    """
    Get current exchange rates for a base currency
    
    Args:
        base: Base currency code (default: USD)
    
    Returns:
        Exchange rates for all supported currencies
    """
    try:
        converter = get_currency_converter()
        supported = converter.get_supported_currencies()
        
        # Get rates for all currencies relative to base
        rates = {}
        for currency in supported:
            if currency != base:
                rates[currency] = converter.get_exchange_rate(base, currency)
        
        return ExchangeRatesResponse(
            base_currency=base,
            rates=rates,
            last_updated=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rates: {str(e)}")


@router.get("/supported", response_model=List[str])
async def get_supported_currencies():
    """
    Get list of supported currency codes
    
    Returns:
        List of currency codes
    """
    converter = get_currency_converter()
    return converter.get_supported_currencies()


@router.delete("/cache")
async def clear_rate_cache():
    """
    Clear the exchange rate cache
    
    Returns:
        Success message
    """
    converter = get_currency_converter()
    converter.clear_cache()
    return {"message": "Cache cleared successfully"}
