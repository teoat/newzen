

def check_precision_risk():
    """
    Simulation of Decimal (Backend) vs Float (Frontend) precision divergence.
    Scenario: Large IDR transaction (Quadrillions) split into cents.
    """
    # 1. Simulate large IDR value in float
    large_val_float = 1_000_000_000_000.55  # 1 Trillion + 55 cents
    
    # 2. Simulate javascript-like operation errors
    # In JS: 0.1 + 0.2 != 0.3
    # In Python Float: same issue often occurs
    
    parts = 3
    so_called_split = large_val_float / parts
    recombined = so_called_split * parts
    
    print(f"Original:   {large_val_float:.20f}")
    print(f"Recombined: {recombined:.20f}")
    
    diff = abs(large_val_float - recombined)
    
    if diff > 0.0000001:
        print(f"[FAIL] Precision Drift Detected: {diff}")
        print("Recommendation: Use Decimal type for all monetary calculations.")
    else:
        print("[PASS] Float precision sufficient for this range.")

if __name__ == "__main__":
    check_precision_risk()
