package com.fabrizio.sistema_reservas.repository;

import com.fabrizio.sistema_reservas.model.Funcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FuncionRepository extends JpaRepository<Funcion, Integer> {
}