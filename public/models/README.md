# 3D Models for AR

## 📦 Where to Get Free 3D Models

### Recommended Sources (Free & Commercial Use)

1. **Sketchfab** (Best for furniture)
   - URL: https://sketchfab.com/
   - Filter by: "Downloadable" + "CC License"
   - Format: Download as GLB
   - Example searches: "chair", "table", "sofa", "lamp"

2. **Poly Haven** (High Quality)
   - URL: https://polyhaven.com/models
   - All models are CC0 (Public Domain)
   - Format: Download GLB version
   - Great for: Furniture, decor items

3. **Quaternius** (Game Assets)
   - URL: https://quaternius.com/
   - All models are CC0
   - Format: GLB available
   - Good for: Simple furniture

4. **Free3D**
   - URL: https://free3d.com/
   - Filter by: "Free" + "GLB/GLTF"
   - Check license before use

5. **CGTrader Free**
   - URL: https://www.cgtrader.com/free-3d-models
   - Filter by: "Free" + "GLB"
   - Check license (look for CC0 or Free)

## 🎯 Quick Start - Download Sample Models

### Option 1: Sketchfab (Recommended)

1. Go to https://sketchfab.com/
2. Search for "chair low poly"
3. Filter: Downloadable ✓, Animated ✗
4. Click on a model
5. Click "Download 3D Model"
6. Select "glTF Binary (.glb)" format
7. Save to this folder (`public/models/`)

### Option 2: Poly Haven

1. Go to https://polyhaven.com/models
2. Browse furniture models
3. Click on a model
4. Download "GLB" format
5. Save to this folder

## 📋 Model Requirements

### File Format
- ✅ **GLB** (recommended) - Binary, single file
- ✅ **GLTF** - Text format with separate files
- ❌ FBX, OBJ, STL - Not supported (need conversion)

### Size Limits
- **Recommended**: < 5MB per model
- **Maximum**: 10MB per model
- **Warning**: > 7MB may cause slow loading

### Technical Requirements
- **Scale**: 1 unit = 1 meter
- **Orientation**: Y-up axis
- **Textures**: Embedded in GLB
- **Polygons**: < 50,000 triangles recommended

## 🔧 Model Optimization

If your models are too large, optimize them:

### Using gltf-pipeline (Command Line)

```bash
# Install
npm install -g gltf-pipeline

# Optimize
gltf-pipeline -i model.glb -o model-optimized.glb -d

# With Draco compression
gltf-pipeline -i model.glb -o model-compressed.glb -d --draco.compressionLevel 10
```

### Using Online Tools

1. **glTF Viewer** - https://gltf-viewer.donmccurdy.com/
   - Upload and inspect models
   - Check size and complexity

2. **glTF Report** - https://gltf.report/
   - Analyze model quality
   - Get optimization suggestions

3. **Gestaltor** - https://gestaltor.io/
   - Online model optimizer
   - Reduce file size

## 📁 Suggested Folder Structure

```
public/models/
├── furniture/
│   ├── chair-modern.glb
│   ├── chair-wooden.glb
│   ├── sofa-leather.glb
│   ├── table-dining.glb
│   └── table-coffee.glb
├── decor/
│   ├── lamp-floor.glb
│   ├── lamp-table.glb
│   ├── plant-indoor.glb
│   └── vase.glb
└── README.md (this file)
```

## 🎨 Sample Model URLs (For Testing)

While you download real models, you can test with these URLs:

### Khronos Sample Models (Always Available)
```
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb
```

## 🚀 Quick Setup Guide

### Step 1: Download Models

Choose 3-5 furniture models from the sources above:
- 1-2 chairs
- 1 table
- 1 sofa
- 1 lamp or plant

### Step 2: Place in Folder

Save all GLB files to: `public/models/`

Example:
```
public/models/chair.glb
public/models/table.glb
public/models/sofa.glb
public/models/lamp.glb
```

### Step 3: Update Model Catalog

Edit `components/ar/ARUIControls.tsx` or your page to reference your models:

```typescript
const modelCatalog = [
  { url: '/models/chair.glb', name: 'Chair', thumbnail: '/thumbnails/chair.png' },
  { url: '/models/table.glb', name: 'Table', thumbnail: '/thumbnails/table.png' },
  { url: '/models/sofa.glb', name: 'Sofa', thumbnail: '/thumbnails/sofa.png' },
  { url: '/models/lamp.glb', name: 'Lamp', thumbnail: '/thumbnails/lamp.png' },
];
```

### Step 4: Test

1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/ar-demo
3. Select a model
4. Click "Start AR Experience"

## 🎯 Recommended First Models

### For Quick Testing:

1. **Simple Chair** (< 1MB)
   - Search: "low poly chair" on Sketchfab
   - Good for: Initial testing

2. **Coffee Table** (< 2MB)
   - Search: "coffee table low poly"
   - Good for: Surface placement testing

3. **Floor Lamp** (< 1MB)
   - Search: "floor lamp simple"
   - Good for: Vertical object testing

## 📝 Model Naming Convention

Use descriptive names:
- ✅ `chair-modern-leather.glb`
- ✅ `table-dining-wooden.glb`
- ✅ `sofa-3seater-fabric.glb`
- ❌ `model1.glb`
- ❌ `untitled.glb`

## 🔍 Model Quality Checklist

Before using a model, check:
- [ ] File size < 5MB
- [ ] GLB format
- [ ] Textures embedded
- [ ] Proper scale (not too big/small)
- [ ] No missing textures
- [ ] Loads in glTF Viewer

## 💡 Tips

1. **Start Simple**: Use low-poly models first
2. **Test Scale**: Some models may be too large/small
3. **Check Orientation**: Models should face forward
4. **Optimize**: Always optimize before production
5. **License**: Always check usage rights

## 🆘 Troubleshooting

### Model Won't Load
- Check file format (must be GLB or GLTF)
- Verify file path is correct
- Check browser console for errors
- Try with a sample model first

### Model Too Large/Small
- Adjust `modelScale` prop in ARManager
- Or edit model in Blender to fix scale

### Model Looks Wrong
- Check textures are embedded
- Verify orientation (Y-up)
- Test in glTF Viewer first

## 📞 Need Help?

1. Test with Khronos sample models first
2. Check model in glTF Viewer
3. Verify file size and format
4. Check browser console for errors

---

**Ready to add models?** Download 3-5 GLB files from the sources above and place them in this folder!
