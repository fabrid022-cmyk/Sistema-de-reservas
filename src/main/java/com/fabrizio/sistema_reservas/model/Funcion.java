package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demo_funcion")
public class Funcion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idFuncion;

    // Horario de la función. El frontend (panel admin) manda y lee este campo.
    private LocalDateTime horario;

    @ManyToOne
    @JoinColumn(name = "sala_id")
    private Sala sala;

    @ManyToOne
    @JoinColumn(name = "pelicula_id")
    private Pelicula pelicula;

    // Campo anterior. Se mantiene sincronizado con "horario" para no tocar la base ni perder datos viejos.
    private LocalDateTime fechaHora;

    @Enumerated(EnumType.STRING)
    private Idioma idioma;

    @Enumerated(EnumType.STRING)
    private Formato formato;

    public Funcion() {}

    public Funcion(Sala sala, Pelicula pelicula, LocalDateTime fechaHora, Idioma idioma, Formato formato) {
        this.sala = sala;
        this.pelicula = pelicula;
        this.horario = fechaHora;
        this.fechaHora = fechaHora;
        this.idioma = idioma;
        this.formato = formato;
    }

    public Integer getIdFuncion() {
        return idFuncion;
    }

    public void setIdFuncion(Integer idFuncion) {
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

    // ANTES: "horario" no tenía getter ni setter, así que Jackson ni lo leía del POST ni lo mandaba en el GET.
    // Resultado: toda función creada desde el admin quedaba sin fecha.
    public LocalDateTime getHorario() {
        return horario != null ? horario : fechaHora;
    }

    public void setHorario(LocalDateTime horario) {
        this.horario = horario;
        this.fechaHora = horario;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora != null ? fechaHora : horario;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
        if (this.horario == null) {
            this.horario = fechaHora;
        }
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