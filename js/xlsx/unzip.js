export function dec(b) { return new TextDecoder("utf-8").decode(b); }

function inflateRaw(bytes) {
  var ds = new DecompressionStream("deflate-raw");
  var st = new Blob([bytes]).stream().pipeThrough(ds);
  return new Response(st).arrayBuffer().then(function (b) { return new Uint8Array(b); });
}

export function unzip(buf) {
  var dv = new DataView(buf), u8 = new Uint8Array(buf);
  var eocd = -1, min = Math.max(0, u8.length - 65558);
  for (var i = u8.length - 22; i >= min; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("El archivo no es un .xlsx válido (no se encontró la estructura ZIP).");
  var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
  var jobs = [], names = [];
  for (var n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    var method = dv.getUint16(p + 10, true);
    var csize = dv.getUint32(p + 20, true);
    var nlen = dv.getUint16(p + 28, true);
    var xlen = dv.getUint16(p + 30, true);
    var clen = dv.getUint16(p + 32, true);
    var lho = dv.getUint32(p + 42, true);
    var name = dec(u8.subarray(p + 46, p + 46 + nlen));
    var lnlen = dv.getUint16(lho + 26, true), lxlen = dv.getUint16(lho + 28, true);
    var start = lho + 30 + lnlen + lxlen;
    var raw = u8.subarray(start, start + csize);
    names.push(name);
    jobs.push(method === 0 ? Promise.resolve(raw) : inflateRaw(raw));
    p += 46 + nlen + xlen + clen;
  }
  return Promise.all(jobs).then(function (vals) {
    var out = {};
    names.forEach(function (nm, i) { out[nm] = vals[i]; });
    return out;
  });
}
