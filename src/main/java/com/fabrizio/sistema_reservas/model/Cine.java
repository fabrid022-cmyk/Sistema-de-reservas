package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Cine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idCine;
    
    private String nombre;
    
    @Embedded 
    private Ubicacion ubicacion;
    
    @OneToMany(mappedBy = "cine", cascade = CascadeType.ALL)
    private List<Sala> salas = new ArrayList<>();

    public Cine() {}

    public Cine(String nombre, Ubicacion ubicacion) {
        this.nombre = nombre;
        this.ubicacion = ubicacion;
    }
    
    public void agregarSala(Sala sala) {
        salas.add(sala);
        sala.setCine(this);
    }

    public int getIdCine() {
        return idCine;
    }

    public void setIdCine(int idCine) {
        this.idCine = idCine;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Ubicacion getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(Ubicacion ubicacion) {
        this.ubicacion = ubicacion;
    }

    public List<Sala> getSalas() {
        return salas;
    }

    public void setSalas(List<Sala> salas) {
        this.salas = salas;
    }
}