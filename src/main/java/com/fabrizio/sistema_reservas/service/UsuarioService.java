package com.fabrizio.sistema_reservas.service;

import com.fabrizio.sistema_reservas.dto.LoginResponseDTO;
import com.fabrizio.sistema_reservas.model.Usuario;
import com.fabrizio.sistema_reservas.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public LoginResponseDTO autenticar(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        
        // Si el usuario existe y la contraseña coincide
        if (usuarioOpt.isPresent() && usuarioOpt.get().getPassword().equals(password)) {
            Usuario u = usuarioOpt.get();
            return new LoginResponseDTO(u.getIdUsuario(), u.getNombre(), u.getRol());
        }
        
        throw new RuntimeException("Credenciales inválidas");
    }
}