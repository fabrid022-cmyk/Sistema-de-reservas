package com.fabrizio.sistema_reservas.dto;

public class SalaDTO {
    private int idSala;
    private int numero;
    private int capacidad;

    public SalaDTO() {}

    public SalaDTO(int idSala, int numero, int capacidad) {
        this.idSala = idSala;
        this.numero = numero;
        this.capacidad = capacidad;
    }

    // --- Getters y Setters ---
    public int getIdSala() { return idSala; }
    public void setIdSala(int idSala) { this.idSala = idSala; }
    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }
    public int getCapacidad() { return capacidad; }
    public void setCapacidad(int capacidad) { this.capacidad = capacidad; }
}