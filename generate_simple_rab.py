
import csv

def parse_currency(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    clean = value.replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def parse_qty(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    clean = value.replace('.', '') # Qty often uses dot for thousands? Or comma?
    # In Indonesian locale (which the file seems to be), dot is thousand, comma is decimal.
    # The previous script parsed currency well with replace(',', '.')
    clean = value.replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def generate_simple_rab(input_path, output_path):
    print(f'Processing {input_path}...')
    items = []
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        rows = list(reader)
        
        for i, row in enumerate(rows):
            if i < 12:
                continue
            if len(row) < 10:
                continue
            
            item_code = row[0].strip()
            description = row[1].strip()
            unit = row[4].strip()
            
            if not item_code or not description:
            
                continue
            if 'DIV' in item_code or 'JUMLAH' in description:
                continue
            if not unit:
                continue # Skip sub-headers

            try:
                # Column indices based on previous analysis
                # CCO Total is at index -4
                # CCO Unit Price is at index -5
                # CCO Quantity is at index -6
                
                # Check indices relative to end 
                # Last col is likely empty
                # -2: Weight
                # -3: Total
                # -4: Price
                # -5: Qty
                
                # Let's inspect the specific row for 9.2.(14) again to be sure:
                # ... ; 8,00 ; 100,000 ;Tetap; 4,00 ; 129.463.819,16 ; 0,54 ; 4,00 ; 28.003.634,73 ; 129.463.819,16 ; 0,54 ;; - ; - ; - ; - ; - ; - ; - ; - ; 8,00 ; 32.365.954,79 ; 258.927.638,32 ; 1,08 ;;
                # The CCO block is the LAST block.
                # Ending: 8,00 ; 32.365.954,79 ; 258.927.638,32 ; 1,08 ;;
                # Indices from end (ignoring last empty):
                # -1: Empty
                # -2: Weight (1,08)
                # -3: Total (258...)
                # -4: Price (32...)
                # -5: Qty (8,00)
                
                cco_qty = parse_qty(row[-5])
                cco_price = parse_currency(row[-4])
                cco_total = parse_currency(row[-3])
                
                if cco_qty > 0 or cco_total > 0:
                
                    items.append({
                        'item_code': item_code,
                        'description': description,
                        'unit': unit,
                        'qty_rab': cco_qty,
                        'unit_price_rab': cco_price,
                        'total_rab': cco_total
                    })
            except Exception:
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
generate_simple_rab(input_file, output_file)
