package com.fabrizio.sistema_reservas.dto;

import java.util.List;

public class CineDTO {
    private int idCine;
    private String nombre;
    private String pais;
    private String direccion;
    private List<SalaDTO> salas;

    public CineDTO() {}

    // --- Getters y Setters ---
    public int getIdCine() { return idCine; }
    public void setIdCine(int idCine) { this.idCine = idCine; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public List<SalaDTO> getSalas() { return salas; }
    public void setSalas(List<SalaDTO> salas) { this.salas = salas; }
}