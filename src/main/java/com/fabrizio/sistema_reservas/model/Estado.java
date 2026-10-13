package com.fabrizio.sistema_reservas.model;

public enum Estado {
    LIBRE,
    PENDIENTE,  // Reemplaza a BLOQUEADA
    CONFIRMADA, // Reemplaza a OCUPADA
    CANCELADA
}