package com.fabrizio.sistema_reservas.repository;

import com.fabrizio.sistema_reservas.model.Cine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CineRepository extends JpaRepository<Cine, Integer> {
}