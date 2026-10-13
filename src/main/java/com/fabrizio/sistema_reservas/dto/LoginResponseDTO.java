package com.fabrizio.sistema_reservas.dto;
import com.fabrizio.sistema_reservas.model.Rol;

public class LoginResponseDTO {
    private int idUsuario;
    private String nombre;
    private Rol rol;

    public LoginResponseDTO(int idUsuario, String nombre, Rol rol) {
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.rol = rol;
    }

    public int getIdUsuario() { return idUsuario; }
    public String getNombre() { return nombre; }
    public Rol getRol() { return rol; }
}