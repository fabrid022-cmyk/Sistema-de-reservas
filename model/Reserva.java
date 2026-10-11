package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idReserva;
    
    private String nombre;
    private LocalDateTime fechaHoraCreacion;
    
    @Enumerated(EnumType.STRING)
    private Estado estado;
    
    @ManyToOne
    @JoinColumn(name = "funcion_id")
    private Funcion funcion;
    
    @ManyToMany 
    @JoinTable(
        name = "reserva_butaca",
        joinColumns = @JoinColumn(name = "reserva_id"),
        inverseJoinColumns = @JoinColumn(name = "butaca_id")
    )
    private List<Butaca> butacas = new ArrayList<>();

    public Reserva() {}

    public Reserva(String nombre, LocalDateTime fechaHoraCreacion, Estado estado, Funcion funcion) {
        this.nombre = nombre;
        this.fechaHoraCreacion = fechaHoraCreacion;
        this.estado = estado;
        this.funcion = funcion;
    }

    public int getIdReserva() {
        return idReserva;
    }

    public void setIdReserva(int idReserva) {
        this.idReserva = idReserva;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalDateTime getFechaHoraCreacion() {
        return fechaHoraCreacion;
    }

    public void setFechaHoraCreacion(LocalDateTime fechaHoraCreacion) {
        this.fechaHoraCreacion = fechaHoraCreacion;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public Funcion getFuncion() {
        return funcion;
    }

    public void setFuncion(Funcion funcion) {
        this.funcion = funcion;
    }

    public List<Butaca> getButacas() {
        return butacas;
    }

    public void setButacas(List<Butaca> butacas) {
        this.butacas = butacas;
    }
}