import bpy, bmesh, math, sys, os
from mathutils import Vector
args = dict(a.split('=') for a in sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else {}
OUT = args.get('out', '.'); RES = int(args.get('res', 560)); ANG = float(args.get('ang', 34)); PASSES = args.get('passes', 'mask,uv,diff,gloss').split(',')
POSE = args.get('pose', 'stand')
W, H, T = 0.21, 0.28, 0.034
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
# ---- geometry: extrude cross-section along z
prof = []
# front face from spine to right edge with hinge groove
prof += [(0.0, 0.0), (0.0095, 0.0), (0.0112, 0.0011), (0.0122, 0.0013), (0.0132, 0.0011), (0.0149, 0.0), (W, 0.0), (W, T)]
# back face (mirror groove)
prof += [(0.0149, T), (0.0132, T-0.0011), (0.0122, T-0.0013), (0.0112, T-0.0011), (0.0095, T), (0.0, T)]
# spine bulge from back to front
N = 14
for i in range(1, N):
    t = i / N; y = T * (1 - t); x = -0.0045 * math.sin(math.pi * t)
    prof.append((x, y))
bm = bmesh.new()
bot = [bm.verts.new((x, y, 0)) for x, y in prof]
top = [bm.verts.new((x, y, H)) for x, y in prof]
n = len(prof)
for i in range(n):
    j = (i + 1) % n
    bm.faces.new((bot[i], bot[j], top[j], top[i]))
bm.faces.new(list(reversed(bot))); bm.faces.new(top)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new('book'); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('book', me); sc.collection.objects.link(ob)
for p in me.polygons: p.use_smooth = True
mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = 0.0018; mod.segments = 4; mod.limit_method = 'ANGLE'; mod.angle_limit = math.radians(50)
ob.modifiers.new('ws', 'WEIGHTED_NORMAL')
ob.rotation_euler = (0, 0, math.radians(ANG))
# ---- ground (shadow catcher)
bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0)); gp = bpy.context.active_object; gp.is_shadow_catcher = True
# ---- camera
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 85
cx, cz = W * 0.42, H * 0.5
dist = float(args.get('dist', 0.95))
cam.location = (cx - 0.02, -dist, cz + 0.06)
d = Vector((cx + 0.01, 0.03, cz - 0.004)) - cam.location
cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
sc.render.resolution_x = RES; sc.render.resolution_y = int(RES * 1.25)
cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 24
cam.data.lens = float(args.get('lens', 55))
bpy.context.view_layer.update()
from bpy_extras.object_utils import world_to_camera_view
def bbox():
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg)
    pts = [world_to_camera_view(sc, cam, ev.matrix_world @ v.co) for v in ev.data.vertices]
    xs = [p.x for p in pts]; ys = [p.y for p in pts]
    return min(xs), max(xs), min(ys), max(ys)
for it in range(6):
    bpy.context.view_layer.update()
    x0, x1, y0, y1 = bbox()
    fill = float(args.get('fill_h', 0.86))
    cam.data.lens *= fill / (y1 - y0)
    bpy.context.view_layer.update()
    x0, x1, y0, y1 = bbox()
    asp = sc.render.resolution_x / sc.render.resolution_y
    cam.data.shift_x += ((x0 + x1) / 2 - 0.5) * asp if asp < 1 else ((x0 + x1) / 2 - 0.5)
    cam.data.shift_y += ((y0 + y1) / 2 - 0.5 + float(args.get('dy', 0.0)))
print('bbox', bbox(), cam.data.lens)
# ---- lights
def area(name, loc, energy, size, rot):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((cx, 0, cz)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o
area('key', (-0.9, -1.0, 0.9), float(args.get('key', 22)), 1.2, None)
area('fill', (0.9, -0.9, 0.4), float(args.get('fill', 8)), 1.5, None)
area('top', (0.1, -0.2, 1.4), 6, 1.0, None)
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1); world.node_tree.nodes['Background'].inputs[1].default_value = float(args.get('world', 0.12))
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.render.film_transparent = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
# ---- materials
def mat(kind):
    m = bpy.data.materials.new(kind); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for x in list(N): N.remove(x)
    out = N.new('ShaderNodeOutputMaterial')
    if kind == 'mask':
        e = N.new('ShaderNodeEmission'); e.inputs[0].default_value = (1, 1, 1, 1); L.new(e.outputs[0], out.inputs[0])
    elif kind == 'uv':
        tc = N.new('ShaderNodeTexCoord'); sx = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sx.inputs[0])
        geo = N.new('ShaderNodeNewGeometry'); vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'OBJECT'
        L.new(geo.outputs['Normal'], vt.inputs[0]); sn = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs[0], sn.inputs[0])
        def m_(op, a, b=None, clamp=False):
            n_ = N.new('ShaderNodeMath'); n_.operation = op; n_.use_clamp = clamp
            for k, v in enumerate([a, b]):
                if v is None: continue
                if isinstance(v, (int, float)): n_.inputs[k].default_value = v
                else: L.new(v, n_.inputs[k])
            return n_.outputs[0]
        uf = m_('DIVIDE', sx.outputs[0], W); us = m_('SUBTRACT', 1.0, m_('DIVIDE', sx.outputs[1], T))
        vv = m_('DIVIDE', sx.outputs[2], H)
        isF = m_('LESS_THAN', sn.outputs[1], -0.6)           # front
        isS = m_('MULTIPLY', m_('LESS_THAN', sn.outputs[0], -0.45), m_('SUBTRACT', 1.0, isF))  # spine
        u = m_('ADD', m_('MULTIPLY', isF, uf), m_('MULTIPLY', isS, us))
        reg = m_('ADD', m_('ADD', m_('MULTIPLY', isF, 0.25), m_('MULTIPLY', isS, 0.5)), m_('MULTIPLY', m_('SUBTRACT', 1.0, m_('ADD', isF, isS)), 0.75))
        cmb = N.new('ShaderNodeCombineRGB'); L.new(m_('MINIMUM', m_('MAXIMUM', u, 0.0), 1.0), cmb.inputs[0]); L.new(m_('MINIMUM', m_('MAXIMUM', vv, 0.0), 1.0), cmb.inputs[1]); L.new(reg, cmb.inputs[2])
        e = N.new('ShaderNodeEmission'); L.new(cmb.outputs[0], e.inputs[0]); L.new(e.outputs[0], out.inputs[0])
    elif kind == 'diff':
        b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1); b.inputs['Roughness'].default_value = 0.65
        b.inputs['Specular IOR Level'].default_value = 0.0; L.new(b.outputs[0], out.inputs[0])
    elif kind == 'gloss':
        g = N.new('ShaderNodeBsdfGlossy'); g.inputs[0].default_value = (0.5, 0.5, 0.5, 1); g.inputs[1].default_value = 0.28
        d_ = N.new('ShaderNodeBsdfDiffuse'); d_.inputs[0].default_value = (0, 0, 0, 1)
        fr = N.new('ShaderNodeFresnel'); fr.inputs[0].default_value = 1.5
        mx = N.new('ShaderNodeMixShader'); L.new(fr.outputs[0], mx.inputs[0]); L.new(d_.outputs[0], mx.inputs[1]); L.new(g.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs[0])
    return m
for p in PASSES:
    ob.data.materials.clear(); ob.data.materials.append(mat(p))
    gp.hide_render = p != 'diff'
    sc.cycles.samples = {'mask': 32, 'uv': 1, 'diff': 96, 'gloss': 96}[p]
    sc.cycles.use_denoising = p in ('diff', 'gloss')
    sc.render.filter_size = 0.01 if p == 'uv' else 1.5
    sc.render.image_settings.color_depth = '16' if p == 'uv' else '8'
    sc.render.dither_intensity = 0 if p == 'uv' else 1
    sc.cycles.use_adaptive_sampling = p != 'uv'
    sc.view_settings.view_transform = 'Raw' if p == 'uv' else 'Standard'
    sc.render.filepath = os.path.join(OUT, p + '.png')
    bpy.ops.render.render(write_still=True)
print('done')
