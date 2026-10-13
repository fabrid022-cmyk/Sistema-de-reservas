package com.fabrizio.sistema_reservas.repository;

import com.fabrizio.sistema_reservas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    // Este método mágico de Spring busca a un usuario por su email para el Login
    Optional<Usuario> findByEmail(String email);
}