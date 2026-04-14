"use strict";

const {
  contextBridge,
} = require("electron");

contextBridge.exposeInMainWorld(
  "Semaplan_Desktop",
  {
    Activo: true,
  }
);
