/* ============================================================
   CIEL PHOTO BOOKS — device storage (IndexedDB)
   Projects and photographs are kept privately in this browser.
   Nothing here is uploaded while a customer designs.
   ============================================================ */
(function (root) {
  'use strict';
  var DB = 'ciel-photobooks', VER = 1, dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!root.indexedDB) return rej(new Error('This browser cannot store projects (IndexedDB is unavailable). Try a different browser or turn off private browsing.'));
      var r = indexedDB.open(DB, VER);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' }).createIndex('project', 'projectId');
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
        if (!db.objectStoreNames.contains('versions')) db.createObjectStore('versions', { keyPath: 'id' }).createIndex('project', 'projectId');
        if (!db.objectStoreNames.contains('purchases')) db.createObjectStore('purchases', { keyPath: 'id' }).createIndex('project', 'projectId');
      };
      r.onsuccess = function () { r.result.onversionchange = function () { r.result.close(); dbp = null; }; res(r.result); };
      r.onerror = function () { rej(r.error || new Error('Could not open storage')); };
      r.onblocked = function () { rej(new Error('Storage is busy in another tab. Close other Photo Books tabs and reload.')); };
    });
    return dbp;
  }
  function tx(stores, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(stores, mode), out;
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error || new Error('Storage error')); };
        t.onabort = function () { var e = t.error; rej(e && e.name === 'QuotaExceededError' ? new Error('This device is out of storage space for photos. Free some space or remove photos you are not using.') : (e || new Error('Storage was interrupted'))); };
        out = fn(t);
      });
    });
  }
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function all(store, index, key) {
    return open().then(function (db) { var s = db.transaction(store).objectStore(store); return req(index ? s.index(index).getAll(key) : s.getAll()); });
  }
  function get(store, key) { return open().then(function (db) { return req(db.transaction(store).objectStore(store).get(key)); }); }
  function put(store, val, key) { return tx([store], 'readwrite', function (t) { t.objectStore(store).put(val, key); }); }
  function del(store, key) { return tx([store], 'readwrite', function (t) { t.objectStore(store).delete(key); }); }

  var S = {
    open: open,
    projects: function () { return all('projects').then(function (l) { return l.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }); }); },
    project: function (id) { return get('projects', id); },
    saveProject: function (p) { p.updatedAt = Date.now(); return put('projects', p).then(function () { return p; }); },
    photos: function (projectId) { return all('photos', 'project', projectId); },
    savePhoto: function (meta, blobs) {
      return tx(['photos', 'blobs'], 'readwrite', function (t) {
        t.objectStore('photos').put(meta);
        Object.keys(blobs).forEach(function (k) { t.objectStore('blobs').put(blobs[k], meta.id + ':' + k); });
      });
    },
    updatePhoto: function (meta) { return put('photos', meta); },
    blob: function (photoId, kind) { return get('blobs', photoId + ':' + kind); },
    removePhotos: function (ids) {
      return tx(['photos', 'blobs'], 'readwrite', function (t) {
        ids.forEach(function (id) { t.objectStore('photos').delete(id); ['orig', 'prev', 'thumb'].forEach(function (k) { t.objectStore('blobs').delete(id + ':' + k); }); });
      });
    },
    /** delete a project and every photo of it (purchase records on this device are kept unless asked) */
    deleteProject: function (id, alsoPurchases) {
      return S.photos(id).then(function (ph) {
        return Promise.all([all('versions', 'project', id), alsoPurchases ? all('purchases', 'project', id) : []]).then(function (r) {
          return tx(['projects', 'photos', 'blobs', 'versions', 'purchases'], 'readwrite', function (t) {
            t.objectStore('projects').delete(id);
            ph.forEach(function (p) { t.objectStore('photos').delete(p.id); ['orig', 'prev', 'thumb'].forEach(function (k) { t.objectStore('blobs').delete(p.id + ':' + k); }); });
            r[0].forEach(function (v) { t.objectStore('versions').delete(v.id); });
            r[1].forEach(function (v) { t.objectStore('purchases').delete(v.id); });
          });
        });
      });
    },
    /** copy a project including its photos (new ids, same image data) */
    duplicateProject: function (src, newId, uid) {
      return S.photos(src.id).then(function (ph) {
        var map = {}, copy = JSON.parse(JSON.stringify(src));
        copy.id = newId; copy.name = (src.name || 'Photo book') + ' (copy)'; copy.createdAt = Date.now(); delete copy.approved;
        return Promise.all(ph.map(function (p) {
          var nid = uid('ph'); map[p.id] = nid;
          return Promise.all(['orig', 'prev', 'thumb'].map(function (k) { return S.blob(p.id, k); })).then(function (b) {
            var m = Object.assign({}, p, { id: nid, projectId: newId });
            return S.savePhoto(m, { orig: b[0], prev: b[1], thumb: b[2] });
          });
        })).then(function () {
          function fix(s) { if (s && s.photo && map[s.photo]) s.photo = map[s.photo]; }
          (copy.pages || []).forEach(function (pg) { (pg.slots || []).forEach(fix); });
          if (copy.cover) { fix(copy.cover.photo); if (copy.cover.back) fix(copy.cover.back.photo); }
          copy.photoOrder = (copy.photoOrder || []).map(function (id) { return map[id] || id; }).filter(Boolean);
          return S.saveProject(copy);
        });
      });
    },
    saveVersion: function (v) { return put('versions', v); },
    version: function (id) { return get('versions', id); },
    purchases: function (projectId) { return projectId ? all('purchases', 'project', projectId) : all('purchases'); },
    savePurchase: function (p) { return put('purchases', p); },
    estimate: function () { return navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null); },
    persist: function () { return navigator.storage && navigator.storage.persist ? navigator.storage.persist().catch(function () { return false; }) : Promise.resolve(false); }
  };
  root.PBStore = S;
})(self);
