import csv
import os
from typing import List, Dict

def clean_csv(input_file: str, output_file: str = None) -> str:
    """
    Clean a CSV file by properly handling quoted fields with line breaks and missing values.
    
    Args:
        input_file (str): Path to the input CSV file
        output_file (str): Path to the output CSV file. If None, will use input_file_cleaned.csv
        
    Returns:
        str: Path to the cleaned CSV file
    """
    if output_file is None:
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_cleaned.csv"
    
    cleaned_rows: List[Dict] = []
    
    try:
        # Read the CSV file with proper quote handling
        with open(input_file, 'r', encoding='utf-8') as f:
            # Use csv.reader with proper quote handling
            csv_reader = csv.reader(
                f,
                quotechar='"',  # Use double quote as quote character
                delimiter=',',  # Use comma as delimiter
                quoting=csv.QUOTE_ALL  # Quote all fields
            )
            
            # Get headers from first row
            headers = next(csv_reader)
            expected_columns = len(headers)
            
            # Process each row
            for row_num, row in enumerate(csv_reader, start=2):
                # Create a dictionary for the row
                row_dict = {}
                
                # Fill missing values with None
                while len(row) < expected_columns:
                    row.append(None)
                    
                # Map values to headers
                for header, value in zip(headers, row):
                    # Clean the value
                    if value:
                        # Remove extra whitespace and normalize line breaks
                        value = value.strip().replace('\r\n', ' ').replace('\n', ' ')
                    row_dict[header] = value
                
                cleaned_rows.append(row_dict)
        
        # Write the cleaned data to the output file
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(cleaned_rows)
            
        print(f"Successfully cleaned CSV file. Output saved to: {output_file}")
        return output_file
        
    except Exception as e:
        print(f"Error processing CSV file: {str(e)}")
        raise

if __name__ == "__main__":
    # Example usage
    input_csv = "product-cervejas.csv"
    clean_csv(input_csv) 