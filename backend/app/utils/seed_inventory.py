from sqlalchemy.orm import Session

from app.models import Product

# (name, category, price, stock, return_window_days, is_refundable)
_PRODUCTS: list[tuple] = [
    # Electronics
    ("Wireless Earbuds Pro", "Electronics", 79.99, 120, 30, True),
    ("Smartwatch X200", "Electronics", 249.99, 45, 30, True),
    ("Gaming Mouse RGB", "Electronics", 59.99, 200, 30, True),
    ('4K Monitor 27"', "Electronics", 429.99, 30, 30, True),
    ("Mechanical Keyboard", "Electronics", 149.99, 80, 30, True),
    ("USB-C Hub 7-in-1", "Electronics", 39.99, 300, 30, True),
    ("Webcam 1080p", "Electronics", 69.99, 150, 30, True),
    ("Noise-Cancelling Headphones", "Electronics", 299.99, 60, 30, True),
    ("Portable Charger 20000mAh", "Electronics", 34.99, 400, 30, True),
    ("Bluetooth Speaker", "Electronics", 89.99, 110, 30, True),
    # Clothing
    ("Running Shoes", "Clothing", 119.99, 200, 60, True),
    ("Waterproof Jacket", "Clothing", 189.99, 75, 60, True),
    ("Yoga Pants", "Clothing", 49.99, 350, 45, True),
    ("Casual T-Shirt Pack (3)", "Clothing", 34.99, 500, 30, True),
    ("Winter Boots", "Clothing", 159.99, 90, 60, True),
    ("Denim Jeans", "Clothing", 79.99, 280, 45, True),
    ("Hoodie Sweatshirt", "Clothing", 59.99, 320, 30, True),
    ("Formal Dress Shirt", "Clothing", 49.99, 180, 30, True),
    ("Sports Socks 6-Pack", "Clothing", 19.99, 600, 30, True),
    ("Swimwear", "Clothing", 39.99, 140, 14, False),
    # Home & Kitchen
    ("Coffee Maker Deluxe", "Home & Kitchen", 129.99, 95, 30, True),
    ("Air Fryer XL", "Home & Kitchen", 89.99, 110, 30, True),
    ("Robot Vacuum", "Home & Kitchen", 349.99, 40, 30, True),
    ("Instant Pot 6Qt", "Home & Kitchen", 99.99, 85, 30, True),
    ("Blender Pro 1200W", "Home & Kitchen", 79.99, 130, 30, True),
    ("Non-stick Pan Set (3)", "Home & Kitchen", 59.99, 200, 30, True),
    ("Electric Kettle", "Home & Kitchen", 34.99, 250, 30, True),
    ("Stand Mixer", "Home & Kitchen", 299.99, 35, 30, True),
    ("Memory Foam Pillow", "Home & Kitchen", 49.99, 180, 30, True),
    ("Smart LED Bulbs 4-Pack", "Home & Kitchen", 29.99, 400, 30, True),
    # Sports & Outdoors
    ("Yoga Mat Premium", "Sports", 45.99, 220, 30, True),
    ("Resistance Bands Set", "Sports", 24.99, 350, 30, True),
    ("Adjustable Dumbbells", "Sports", 199.99, 55, 30, True),
    ("Bicycle Helmet", "Sports", 59.99, 130, 30, True),
    ("Water Bottle 1L", "Sports", 19.99, 500, 30, True),
    ("Trekking Poles", "Sports", 79.99, 90, 30, True),
    ("Jump Rope Pro", "Sports", 14.99, 400, 30, True),
    ("Foam Roller", "Sports", 29.99, 280, 30, True),
    ("Camping Tent 2-Person", "Sports", 149.99, 65, 30, True),
    ("Fitness Tracker Band", "Sports", 69.99, 160, 30, True),
    # Books
    ("Python Programming Guide", "Books", 39.99, 80, 14, True),
    ("Business Strategy 2025", "Books", 29.99, 120, 14, True),
    ("Cookbook: World Flavors", "Books", 24.99, 200, 14, True),
    ("Atomic Habits", "Books", 19.99, 350, 14, True),
    ("Art of Thinking Clearly", "Books", 17.99, 180, 14, True),
    # Beauty & Personal Care
    ("Electric Toothbrush Pro", "Beauty", 89.99, 120, 30, True),
    ("Vitamin C Serum", "Beauty", 29.99, 300, 30, True),
    ("Hair Dryer 2200W", "Beauty", 69.99, 140, 30, True),
    ("Perfume Gift Box", "Beauty", 79.99, 80, 14, False),
    ("Skincare Starter Bundle", "Beauty", 49.99, 200, 30, True),
]


def seed_inventory(db: Session) -> None:
    if db.query(Product).count() > 0:
        return
    db.bulk_save_objects([
        Product(
            name=name,
            category=category,
            price=price,
            stock=stock,
            return_window_days=window,
            is_refundable=refundable,
        )
        for name, category, price, stock, window, refundable in _PRODUCTS
    ])
    db.commit()
