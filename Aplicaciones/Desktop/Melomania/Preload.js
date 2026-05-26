"use strict";

const {
  contextBridge,
} = require("electron");

contextBridge.exposeInMainWorld(
  "Semaplan_Melomania",
  {
    Activo: true,
  }
);
