// ─────────────────────────────────────────────────────────────────
// EcommerceApplication.java — Ponto de entrada da aplicação Spring Boot
//
// Esta é a classe principal que inicializa toda a aplicação.
// O Spring Boot realiza automaticamente:
//   - Escaneamento de componentes (@Component, @Service, @Repository, @Controller)
//   - Configuração automática do JPA, Security, MVC, etc.
//   - Inicialização do servidor embutido (Tomcat por padrão)
//
// Para executar a aplicação:
//   - Via Maven: ./mvnw spring-boot:run
//   - Via IDE: execute o método main desta classe
//   - Via JAR:  java -jar target/ecommerce-*.jar
//
// Não é necessário modificar este arquivo em condições normais.
// ─────────────────────────────────────────────────────────────────
package com.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EcommerceApplication {

	// Método main — ponto de entrada da JVM.
	// SpringApplication.run() inicializa o contexto Spring, configura o servidor
	// embutido e inicia a aplicação escutando na porta definida em application.properties (padrão: 8080)
	public static void main(String[] args) {
		SpringApplication.run(EcommerceApplication.class, args);
	}

}
