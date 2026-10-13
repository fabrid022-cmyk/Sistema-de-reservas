package com.fabrizio.sistema_reservas.repository;

import com.fabrizio.sistema_reservas.model.Funcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FuncionRepository extends JpaRepository<Funcion, Integer> {
    // Busca las funciones navegando desde Sala hasta el ID del Cine
    List<Funcion> findBySala_Cine_IdCine(Integer idCine);
}