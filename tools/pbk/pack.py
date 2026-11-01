import cv2, numpy as np, json, sys
from PIL import Image
src = sys.argv[1]; out = sys.argv[2]; size = int(sys.argv[3]) if len(sys.argv) > 3 else 0
uv = cv2.imread(src + '/uv.png', cv2.IMREAD_UNCHANGED)[..., [2, 1, 0, 3]].astype(np.float64) / 65535
mask = np.array(Image.open(src + '/mask.png')).astype(np.float64) / 255
diff = np.array(Image.open(src + '/diff.png')).astype(np.float64) / 255
gloss = np.array(Image.open(src + '/gloss.png')).astype(np.float64) / 255
H, W = mask.shape[:2]
A = mask[..., 3]
reg = np.round(uv[..., 2] * 4).astype(int) * (uv[..., 3] > 0.5)
lum = lambda x: x[..., 0] * .299 + x[..., 1] * .587 + x[..., 2] * .114
D = lum(diff)
S = lum(gloss) * gloss[..., 3]
front = (reg == 1)
ys, xs = np.where(front)
cy, cx = int(ys.mean()), int(xs.mean())
med = np.median(D[cy - 40:cy + 40, cx - 40:cx + 40])
D = D / med * 0.98
from scipy import ndimage as ndi2
sc_ = W / 720
sh = ndi2.shift(A, (12 * sc_, 9 * sc_), order=1)
sh = ndi2.gaussian_filter(sh, 13 * sc_) * 0.42
contact = ndi2.gaussian_filter(ndi2.shift(A, (3 * sc_, 0), order=1), 3 * sc_) * 0.25
shadow = np.clip(np.maximum(sh, contact), 0, 1) * (1 - A)
print('median', med, 'D range', D[A > .5].min(), D[A > .5].max(), 'S max', S.max(), 'reg counts', [(reg == k).sum() for k in range(4)])
# fill D/uv for antialiased edge pixels that missed the 1-spp uv pass: dilate region/uv into mask area
missing = (A > 0.02) & (reg == 0)
if missing.any():
    from scipy import ndimage as ndi
    idx = ndi.distance_transform_edt(reg == 0, return_distances=False, return_indices=True)
    for arr in (uv,):
        for c in range(3): arr[..., c] = np.where(missing, arr[..., c][idx[0], idx[1]], arr[..., c])
    reg = np.where(missing, reg[idx[0], idx[1]], reg)
u16 = (np.clip(uv[..., 0], 0, 1) * 65535).astype(np.uint32); v16 = (np.clip(uv[..., 1], 0, 1) * 65535).astype(np.uint32)
t0 = np.stack([u16 >> 8, u16 & 255, v16 >> 8], -1).astype(np.uint8)
t1 = np.stack([v16 & 255, reg * 60, np.clip(D / 1.4 * 255, 0, 255)], -1).astype(np.uint8)
t2 = np.stack([np.clip(S * 255 * 1.0, 0, 255), A * 255, shadow * 255], -1).astype(np.uint8)
def rs(t, nearest):
    if not size: return t
    h = int(size * H / W)
    return np.array(Image.fromarray(t).resize((size, h), Image.NEAREST if nearest else Image.LANCZOS))
t0r, t1r = rs(t0, True), rs(t1, True)
t1r[..., 2] = rs(t1, False)[..., 2]
t2r = rs(t2, False)
img = np.concatenate([t0r, t1r, t2r], 0)
Image.fromarray(img).save(out, optimize=True)
print(out, img.shape)
