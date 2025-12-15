"""Seed script for inventory/spare parts data"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import SessionLocal
from db.models.spare_part import SparePart

def seed_spare_parts():
    """Seed spare parts data"""
    db = SessionLocal()
    
    try:
        # Check if we already have data
        existing_count = db.query(SparePart).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} spare parts. Skipping seed.")
            return
        
        spare_parts_data = [
            {
                'part_name': 'Hydraulic Filter 50 micron',
                'category': 'Filters',
                'price_per_unit': 45.00,
                'quantity': 12
            },
            {
                'part_name': 'Bearing 6204-2RS',
                'category': 'Bearings',
                'price_per_unit': 12.50,
                'quantity': 4
            },
            {
                'part_name': 'Synthetic Oil 5W-40',
                'category': 'Lubricants',
                'price_per_unit': 8.00,
                'quantity': 50
            },
            {
                'part_name': 'V-Belt B42',
                'category': 'Belts',
                'price_per_unit': 22.00,
                'quantity': 2
            },
            {
                'part_name': 'Proximity Sensor M12',
                'category': 'Sensors',
                'price_per_unit': 85.00,
                'quantity': 15
            },
            {
                'part_name': 'Chain Link 3/8"',
                'category': 'Chains',
                'price_per_unit': 3.50,
                'quantity': 25
            },
            {
                'part_name': 'Pneumatic Cylinder 25mm',
                'category': 'Pneumatics',
                'price_per_unit': 120.00,
                'quantity': 6
            },
            {
                'part_name': 'Pressure Switch 0-10 Bar',
                'category': 'Sensors',
                'price_per_unit': 45.00,
                'quantity': 8
            },
            {
                'part_name': 'Coupling Flexible 20mm',
                'category': 'Couplings',
                'price_per_unit': 15.00,
                'quantity': 10
            },
            {
                'part_name': 'Electrical Terminal Block',
                'category': 'Electrical',
                'price_per_unit': 5.50,
                'quantity': 30
            }
        ]
        
        for part_data in spare_parts_data:
            spare_part = SparePart(**part_data)
            db.add(spare_part)
        
        db.commit()
        print(f"Successfully seeded {len(spare_parts_data)} spare parts!")
        
    except Exception as e:
        print(f"Error seeding spare parts: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_spare_parts()