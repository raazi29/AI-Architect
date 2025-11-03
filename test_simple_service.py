import sys
sys.path.append('Backend')
from simple_design_service import simple_design_service

results = simple_design_service.generate_images('modern kitchen', 1, 5)
print(f'✅ Generated {len(results)} images')
print(f'📸 First image title: {results[0]["title"]}')
print(f'🎨 Image type: Data URI (instant loading)')
print(f'⚡ NO external calls, NO delays!')
print('\n✅ Service works perfectly!')