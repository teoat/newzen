
import csv
import re

def parse_currency(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    # Check if value looks like a number
    if not re.match(r'^[\d\.,\s]+$', value.strip()):
        return 0.0
    
    clean = value.replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def generate_simple_rab_robust(input_path, output_path):
    print(f'Processing {input_path}...')
    items = []
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        rows = list(reader)
        
        for i, row in enumerate(rows):
            if i < 12:
                continue
            
            # Filter out empty cells to see actual data structure
            non_empty = [c.strip() for c in row if c.strip()]
            
            if len(non_empty) < 5:
            
                continue # Too short to contain Item, Desc, Unit, Values
            
            item_code = row[0].strip()
            # Try to find description - usually 2nd distinct non-empty value if row[1] is populated
            description = row[1].strip()
            unit = row[4].strip()

            if not item_code or not description:

                continue
            if 'DIV' in item_code or 'JUMLAH' in description:
                continue
            if len(item_code) > 10:
                continue # Likely a description overflow
            
            # Heuristic: The CCO block is the LAST block of numeric values rows.
            # A valid row ends with: [Qty, UnitPrice, TotalPrice, Weight]
            # Let's grab the last 4 non-empty values
            
            try:
                # Get last 4 non-empty values
                last_vals = non_empty[-4:] 
                # [Qty, Price, Total, Weight]
                
                # Check if they look like numbers
                cco_qty = parse_currency(last_vals[0])
                cco_price = parse_currency(last_vals[1])
                cco_total = parse_currency(last_vals[2])
                
                # logic check: qty * price should roughly equal total (allow rounding)
                # or price * qty
                
                # If total is 0, maybe it wasn't a valid row
                if cco_qty == 0 and cco_total == 0:
                    continue
                
                items.append({
                    'item_code': item_code,
                    'description': description,
                    'unit': unit,
                    'qty_rab': cco_qty,
                    'unit_price_rab': cco_price,
                    'total_rab': cco_total
                })
            except Exception:
                # print(f"Skipping {item_code}: {e}")
                pass

    print(f'writing {len(items)} items to {output_path}...')
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['item_code', 'description', 'unit', 'qty_rab', 'unit_price_rab', 'total_rab'])
        
        for item in items:
            writer.writerow([
                item['item_code'],
                item['description'],
                item['unit'],
                f"{item['qty_rab']:.2f}",
                f"{item['unit_price_rab']:.2f}",
                f"{item['total_rab']:.2f}"
            ])

input_file = '/Users/Arief/Library/Mobile Documents/com~apple~CloudDocs/Aldi/data cco aldi/00003792-CCO WAI IPE SAIYA JUSTEK/CCO 01-Table 1.csv'
output_file = '/Users/Arief/Newzen/zenith-lite/simplified_rab_data.csv'
generate_simple_rab_robust(input_file, output_file)
