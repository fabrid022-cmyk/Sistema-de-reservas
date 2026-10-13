package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class Ubicacion {
    private String pais;
    private String direccion;

    public Ubicacion() {}

    public Ubicacion(String pais, String direccion) {
        this.pais = pais;
        this.direccion = direccion;
    }

    public String getPais() {
        return pais;
    }

    public void setPais(String pais) {
        this.pais = pais;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }
}