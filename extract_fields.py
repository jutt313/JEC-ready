
import argparse
from pypdf import PdfReader

def extract_form_fields(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        fields = reader.get_fields()
        if fields:
            print(f"Form fields in '{pdf_path}':")
            for field_name, field_object in fields.items():
                print(f"  - Name: {field_name}")
        else:
            print(f"No form fields found in '{pdf_path}'.")
    except Exception as e:
        print(f"Error processing PDF file '{pdf_path}': {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract form field data from a PDF file.")
    parser.add_argument("pdf_file", help="The path to the PDF file.")
    args = parser.parse_args()

    extract_form_fields(args.pdf_file)
