#!/usr/bin/env python3
"""
Create simple tabbar icons for the KTV app
"""

from PIL import Image, ImageDraw
import os

def create_home_icon(color="#8E8E93", size=48):
    """Create a home icon"""
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Simple house shape
    # Roof triangle
    draw.polygon([(size//4, size//2), (size//2, size//4), (3*size//4, size//2)], fill=color)
    # House body rectangle  
    draw.rectangle([(size//4 + 4, size//2), (3*size//4 - 4, 3*size//4)], fill=color)
    # Door rectangle
    draw.rectangle([(size//2 - 3, size//2 + 6), (size//2 + 3, 3*size//4)], fill=(255, 255, 255, 0))
    
    return img

def create_person_icon(color="#8E8E93", size=48):
    """Create a person icon"""
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Head circle
    head_radius = size // 8
    head_center = (size // 2, size // 3)
    draw.ellipse([
        head_center[0] - head_radius, head_center[1] - head_radius,
        head_center[0] + head_radius, head_center[1] + head_radius
    ], fill=color)
    
    # Body shape (simplified)
    body_width = size // 3
    body_height = size // 3
    body_x = size // 2 - body_width // 2
    body_y = size // 2
    draw.ellipse([
        body_x, body_y,
        body_x + body_width, body_y + body_height
    ], fill=color)
    
    return img

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# Create output directory
output_dir = '/Users/yy/Documents/GitHub/ktvapp/ktvapp/static/tabbar'
os.makedirs(output_dir, exist_ok=True)

# Color definitions
normal_color = "#8E8E93"
active_color = "#FF9500"

# Create icons
try:
    # Home icons
    home_normal = create_home_icon(normal_color, 48)
    home_active = create_home_icon(active_color, 48)
    
    # Person icons
    person_normal = create_person_icon(normal_color, 48)
    person_active = create_person_icon(active_color, 48)
    
    # Save icons
    home_normal.save(os.path.join(output_dir, 'home.png'))
    home_active.save(os.path.join(output_dir, 'home-active.png'))
    person_normal.save(os.path.join(output_dir, 'mine.png'))
    person_active.save(os.path.join(output_dir, 'mine-active.png'))
    
    print("✅ Tabbar icons created successfully!")
    print(f"📁 Icons saved to: {output_dir}")
    
except ImportError:
    print("⚠️  PIL (Pillow) not available. Icons not created.")
    print("💡 Install with: pip install Pillow")
except Exception as e:
    print(f"❌ Error creating icons: {e}")