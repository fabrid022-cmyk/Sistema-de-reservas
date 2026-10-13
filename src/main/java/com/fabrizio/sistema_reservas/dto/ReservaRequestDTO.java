package com.fabrizio.sistema_reservas.dto;

import java.util.List;

public class ReservaRequestDTO {
    private Integer idUsuario;
    private Integer idSala;
    private List<Integer> butacasSeleccionadas;

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

    public Integer getIdSala() { return idSala; }
    public void setIdSala(Integer idSala) { this.idSala = idSala; }

    public List<Integer> getButacasSeleccionadas() { return butacasSeleccionadas; }
    public void setButacasSeleccionadas(List<Integer> butacasSeleccionadas) { this.butacasSeleccionadas = butacasSeleccionadas; }
}