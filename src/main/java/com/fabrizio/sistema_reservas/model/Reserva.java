package com.fabrizio.sistema_reservas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "demo_reserva")
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idReserva;

    private int idUsuario;
    private int idFuncion;

    private LocalDateTime fechaHoraCreacion;

    @Enumerated(EnumType.STRING)
    private Estado estado;

    @ElementCollection
    @CollectionTable(
        name = "demo_reserva_butacas", 
        joinColumns = @JoinColumn(name = "id_reserva")
    )
    @Column(name = "numero_butaca")
    private List<Integer> butacas;

    public Reserva() {}

    public Reserva(int idUsuario, int idFuncion, List<Integer> butacas) {
        this.idUsuario = idUsuario;
        this.idFuncion = idFuncion;
        this.butacas = butacas;
        this.fechaHoraCreacion = LocalDateTime.now();
        this.estado = Estado.CONFIRMADA;
    }

    // --- GETTERS Y SETTERS ---
    public int getIdReserva() { return idReserva; }
    public void setIdReserva(int idReserva) { this.idReserva = idReserva; }

    public int getIdUsuario() { return idUsuario; }
    public void setIdUsuario(int idUsuario) { this.idUsuario = idUsuario; }

    public int getIdFuncion() { return idFuncion; }
    public void setIdFuncion(int idFuncion) { this.idFuncion = idFuncion; }

    public List<Integer> getButacas() { return butacas; }
    public void setButacas(List<Integer> butacas) { this.butacas = butacas; }

    public LocalDateTime getFechaHoraCreacion() { return fechaHoraCreacion; }
    public void setFechaHoraCreacion(LocalDateTime fechaHoraCreacion) { this.fechaHoraCreacion = fechaHoraCreacion; }

    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
}