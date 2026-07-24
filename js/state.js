export const state = { fase: "all", estado: "all" };

let DATA = null;

export function getData() { return DATA; }

export function setData(d) {
  DATA = d;
  state.fase = "all";
  state.estado = "all";
}

export function faseOk(f) { return state.fase === "all" || f === +state.fase; }

export function estadoOk(e) { return state.estado === "all" || e === state.estado; }
