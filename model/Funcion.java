package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Funcion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idFuncion;
    
    @ManyToOne
    @JoinColumn(name = "sala_id")
    private Sala sala;
    
    @ManyToOne
    @JoinColumn(name = "pelicula_id")
    private Pelicula pelicula;
    
    private LocalDateTime fechaHora;
    
    @Enumerated(EnumType.STRING)
    private Idioma idioma;
    
    @Enumerated(EnumType.STRING)
    private Formato formato;

    public Funcion() {}

    public Funcion(Sala sala, Pelicula pelicula, LocalDateTime fechaHora, Idioma idioma, Formato formato) {
        this.sala = sala;
        this.pelicula = pelicula;
        this.fechaHora = fechaHora;
        this.idioma = idioma;
        this.formato = formato;
    }

    public int getIdFuncion() {
        return idFuncion;
    }

    public void setIdFuncion(int idFuncion) {
        this.idFuncion = idFuncion;
    }

    public Sala getSala() {
        return sala;
    }

    public void setSala(Sala sala) {
        this.sala = sala;
    }

    public Pelicula getPelicula() {
        return pelicula;
    }

    public void setPelicula(Pelicula pelicula) {
        this.pelicula = pelicula;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public Idioma getIdioma() {
        return idioma;
    }

    public void setIdioma(Idioma idioma) {
        this.idioma = idioma;
    }

    public Formato getFormato() {
        return formato;
    }

    public void setFormato(Formato formato) {
        this.formato = formato;
    }
}