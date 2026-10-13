package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "demo_pelicula")
public class Pelicula {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPelicula;
    
    private String titulo;
    private Integer duracionMinutos;
    private String idioma;
    private String formato;

    public Pelicula() {}

    // --- GETTERS Y SETTERS OBLIGATORIOS ---
    public Integer getIdPelicula() { return idPelicula; }
    public void setIdPelicula(Integer idPelicula) { this.idPelicula = idPelicula; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public Integer getDuracionMinutos() { return duracionMinutos; }
    public void setDuracionMinutos(Integer duracionMinutos) { this.duracionMinutos = duracionMinutos; }

    public String getIdioma() { return idioma; }
    public void setIdioma(String idioma) { this.idioma = idioma; }

    public String getFormato() { return formato; }
    public void setFormato(String formato) { this.formato = formato; }
}