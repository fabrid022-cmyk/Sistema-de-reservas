package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;

@Entity
public class Butaca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idButaca;
    
    private String fila;
    private int numero;

    @ManyToOne
    @JoinColumn(name = "sala_id")
    private Sala sala;

    public Butaca() {}

    public Butaca(String fila, int numero) {
        this.fila = fila;
        this.numero = numero;
    }

    public int getIdButaca() {
        return idButaca;
    }

    public void setIdButaca(int idButaca) {
        this.idButaca = idButaca;
    }

    public String getFila() {
        return fila;
    }

    public void setFila(String fila) {
        this.fila = fila;
    }

    public int getNumero() {
        return numero;
    }

    public void setNumero(int numero) {
        this.numero = numero;
    }

    public Sala getSala() {
        return sala;
    }

    public void setSala(Sala sala) {
        this.sala = sala;
    }
}