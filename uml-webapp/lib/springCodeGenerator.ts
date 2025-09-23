import * as joint from "jointjs";

export interface SpringEntity {
  name: string;
  attributes: Array<{
    name: string;
    type: string;
    isId?: boolean;
    isRequired?: boolean;
  }>;
  relationships: Array<{
    type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
    target: string;
    fieldName: string;
    mappedBy?: string;
  }>;
}

export interface GeneratedCode {
  entities: { [key: string]: string };
  repositories: { [key: string]: string };
  services: { [key: string]: string };
  controllers: { [key: string]: string };
  applicationProperties: string;
  pomXml: string;
  mainApplication: string;
}

export class SpringCodeGenerator {
  private entities: SpringEntity[] = [];
  private projectName: string = 'GeneratedSpringApp';

  constructor(projectName?: string) {
    if (projectName) {
      this.projectName = projectName;
    }
  }

  generateFromDiagram(graph: joint.dia.Graph): GeneratedCode {
    this.extractEntitiesFromGraph(graph);
    
    return {
      entities: this.generateEntities(),
      repositories: this.generateRepositories(),
      services: this.generateServices(),
      controllers: this.generateControllers(),
      applicationProperties: this.generateApplicationProperties(),
      pomXml: this.generatePomXml(),
      mainApplication: this.generateMainApplication()
    };
  }

  private extractEntitiesFromGraph(graph: joint.dia.Graph): void {
    const cells = graph.getCells();
    console.log('Total cells found:', cells.length);
    
    cells.forEach((cell, index) => {
      if (cell.isElement && cell.isElement()) {
        const element = cell as joint.dia.Element;
        const elementType = (element as any).get('type');
        const elementName = (element as any).get('name');
        
        console.log(`Cell ${index}:`, {
          type: elementType,
          name: elementName,
          isElement: cell.isElement(),
          attrs: element.attr()
        });
        
        // Detectar clases UML de diferentes maneras
        const isUmlClass = elementType && (
          elementType.includes('uml-class') || 
          elementType.includes('uml.Class') ||
          elementType.includes('Class') ||
          elementName === 'Class'
        );
        
        if (isUmlClass) {
          const name = element.attr('text/text') || 
                      element.attr('.uml-class-name-text/text') || 
                      elementName || 
                      'UnknownEntity';
          const attributes = this.extractAttributes(element);
          const relationships = this.extractRelationships(element, cells);
          
          console.log('Found UML class:', { name, attributes, relationships });
          
          this.entities.push({
            name: this.toPascalCase(name),
            attributes,
            relationships
          });
        }
      }
    });
    
    console.log('Total entities extracted:', this.entities.length);
  }

  private extractAttributes(element: joint.dia.Element): Array<{name: string, type: string, isId?: boolean, isRequired?: boolean}> {
    const attributes: Array<{name: string, type: string, isId?: boolean, isRequired?: boolean}> = [];
    
    // Extraer atributos del elemento UML de diferentes maneras
    let attributesText = element.attr('.uml-class-attributes-text/text') || '';
    
    // Si no hay atributos en el texto, intentar obtenerlos del objeto
    if (!attributesText) {
      const elementAttributes = (element as any).get('attributes') || [];
      if (Array.isArray(elementAttributes)) {
        attributesText = elementAttributes.join('\n');
      }
    }
    
    const attributeLines = attributesText.split('\n').filter((line: string) => line.trim());
    
    attributeLines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed) {
        const [name, type] = trimmed.split(':').map((s: string) => s.trim());
        if (name && type) {
          attributes.push({
            name: this.toCamelCase(name),
            type: this.mapUmlTypeToJava(type),
            isId: name.toLowerCase().includes('id'),
            isRequired: !type.includes('?')
          });
        }
      }
    });

    // Si no hay atributos, agregar un ID por defecto
    if (attributes.length === 0) {
      attributes.push({
        name: 'id',
        type: 'Long',
        isId: true,
        isRequired: true
      });
    }

    return attributes;
  }

  private extractRelationships(element: joint.dia.Element, allCells: joint.dia.Cell[]): Array<{type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany', target: string, fieldName: string, mappedBy?: string}> {
    const relationships: Array<{type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany', target: string, fieldName: string, mappedBy?: string}> = [];
    
    // Buscar links que conectan con este elemento
    allCells.forEach(cell => {
      if (cell.isLink && cell.isLink()) {
        const link = cell as joint.dia.Link;
        const source = link.getSourceElement();
        const target = link.getTargetElement();
        
        if (source && target && (source.id === element.id || target.id === element.id)) {
          const otherElement = source.id === element.id ? target : source;
          const otherName = otherElement.attr('text/text') || (otherElement as any).get('name') || 'Unknown';
          const linkType = (link as any).get('type') || 'association';
          
          let relationshipType: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany' = 'ManyToOne';
          
          // Mapear tipos de relación UML a JPA
          if (linkType.includes('composition') || linkType.includes('aggregation')) {
            relationshipType = 'OneToMany';
          } else if (linkType.includes('generalization')) {
            // Herencia - se maneja con @Inheritance
            return;
          }
          
          relationships.push({
            type: relationshipType,
            target: this.toPascalCase(otherName),
            fieldName: this.toCamelCase(otherName) + (relationshipType === 'OneToMany' ? 's' : '')
          });
        }
      }
    });

    return relationships;
  }

  private generateEntities(): { [key: string]: string } {
    const entities: { [key: string]: string } = {};
    
    this.entities.forEach(entity => {
      entities[`${entity.name}.java`] = this.generateEntityCode(entity);
    });

    return entities;
  }

  private generateEntityCode(entity: SpringEntity): string {
    const packageName = this.projectName.toLowerCase();
    const imports = this.generateEntityImports(entity);
    const annotations = this.generateEntityAnnotations(entity);
    const fields = this.generateEntityFields(entity);
    const constructors = this.generateEntityConstructors(entity);
    const methods = this.generateEntityMethods(entity);

    return `package ${packageName}.model;

${imports}

${annotations}
public class ${entity.name} {
${fields}

${constructors}

${methods}
}`;
  }

  private generateEntityImports(entity: SpringEntity): string {
    const imports = [
      'import javax.persistence.*;',
      'import java.util.Objects;',
      'import java.time.LocalDateTime;'
    ];

    if (entity.relationships.length > 0) {
      imports.push('import java.util.List;');
      imports.push('import java.util.ArrayList;');
    }

    return imports.join('\n');
  }

  private generateEntityAnnotations(entity: SpringEntity): string {
    return `@Entity
@Table(name = "${entity.name.toLowerCase()}s")`;
  }

  private generateEntityFields(entity: SpringEntity): string {
    const fields: string[] = [];

    entity.attributes.forEach(attr => {
      let field = `    `;
      
      if (attr.isId) {
        field += `@Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    `;
      }
      
      if (attr.isRequired && !attr.isId) {
        field += `@Column(nullable = false)\n    `;
      }
      
      field += `private ${attr.type} ${attr.name};`;
      fields.push(field);
    });

    entity.relationships.forEach(rel => {
      let field = `    `;
      
      if (rel.type === 'OneToMany') {
        field += `@OneToMany(mappedBy = "${this.toCamelCase(entity.name)}", cascade = CascadeType.ALL, fetch = FetchType.LAZY)\n    `;
        field += `private List<${rel.target}> ${rel.fieldName} = new ArrayList<>();`;
      } else if (rel.type === 'ManyToOne') {
        field += `@ManyToOne(fetch = FetchType.LAZY)\n    `;
        field += `@JoinColumn(name = "${rel.fieldName}_id")\n    `;
        field += `private ${rel.target} ${rel.fieldName};`;
      } else if (rel.type === 'OneToOne') {
        field += `@OneToOne(fetch = FetchType.LAZY)\n    `;
        field += `@JoinColumn(name = "${rel.fieldName}_id")\n    `;
        field += `private ${rel.target} ${rel.fieldName};`;
      }
      
      fields.push(field);
    });

    return fields.join('\n\n');
  }

  private generateEntityConstructors(entity: SpringEntity): string {
    return `    // Constructor por defecto
    public ${entity.name}() {}

    // Constructor con parámetros principales
    public ${entity.name}(${entity.attributes.filter(attr => attr.isRequired && !attr.isId).map(attr => `${attr.type} ${attr.name}`).join(', ')}) {
${entity.attributes.filter(attr => attr.isRequired && !attr.isId).map(attr => `        this.${attr.name} = ${attr.name};`).join('\n')}
    }`;
  }

  private generateEntityMethods(entity: SpringEntity): string {
    const methods: string[] = [];

    // Getters y Setters
    [...entity.attributes, ...entity.relationships].forEach(field => {
      const fieldName = 'name' in field ? field.name : field.fieldName;
      const fieldType = 'type' in field ? field.type : (field as any).target;
      const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

      methods.push(`    public ${fieldType} get${capitalizedName}() {
        return ${fieldName};
    }

    public void set${capitalizedName}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`);
    });

    // equals y hashCode
    const idField = entity.attributes.find(attr => attr.isId);
    if (idField) {
      methods.push(`    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ${entity.name} ${entity.name.toLowerCase()} = (${entity.name}) o;
        return Objects.equals(${idField.name}, ${entity.name.toLowerCase()}.${idField.name});
    }

    @Override
    public int hashCode() {
        return Objects.hash(${idField.name});
    }`);
    }

    // toString
    methods.push(`    @Override
    public String toString() {
        return "${entity.name}{" +
${entity.attributes.map(attr => `                "${attr.name}=" + ${attr.name} +`).join('\n')}
                '}';
    }`);

    return methods.join('\n\n');
  }

  private generateRepositories(): { [key: string]: string } {
    const repositories: { [key: string]: string } = {};
    
    this.entities.forEach(entity => {
      repositories[`${entity.name}Repository.java`] = this.generateRepositoryCode(entity);
    });

    return repositories;
  }

  private generateRepositoryCode(entity: SpringEntity): string {
    const packageName = this.projectName.toLowerCase();
    const idType = entity.attributes.find(attr => attr.isId)?.type || 'Long';

    return `package ${packageName}.repository;

import ${packageName}.model.${entity.name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ${entity.name}Repository extends JpaRepository<${entity.name}, ${idType}> {
    
    // Métodos de consulta personalizados
    List<${entity.name}> findByNameContainingIgnoreCase(String name);
    
    @Query("SELECT e FROM ${entity.name} e WHERE e.createdDate >= :startDate")
    List<${entity.name}> findByCreatedDateAfter(@Param("startDate") java.time.LocalDateTime startDate);
    
    @Query("SELECT COUNT(e) FROM ${entity.name} e")
    long countAll();
}`;
  }

  private generateServices(): { [key: string]: string } {
    const services: { [key: string]: string } = {};
    
    this.entities.forEach(entity => {
      services[`${entity.name}Service.java`] = this.generateServiceCode(entity);
    });

    return services;
  }

  private generateServiceCode(entity: SpringEntity): string {
    const packageName = this.projectName.toLowerCase();
    const idType = entity.attributes.find(attr => attr.isId)?.type || 'Long';

    return `package ${packageName}.service;

import ${packageName}.model.${entity.name};
import ${packageName}.repository.${entity.name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ${entity.name}Service {
    
    @Autowired
    private ${entity.name}Repository ${entity.name.toLowerCase()}Repository;
    
    public List<${entity.name}> findAll() {
        return ${entity.name.toLowerCase()}Repository.findAll();
    }
    
    public Optional<${entity.name}> findById(${idType} id) {
        return ${entity.name.toLowerCase()}Repository.findById(id);
    }
    
    public ${entity.name} save(${entity.name} ${entity.name.toLowerCase()}) {
        return ${entity.name.toLowerCase()}Repository.save(${entity.name.toLowerCase()});
    }
    
    public ${entity.name} update(${idType} id, ${entity.name} ${entity.name.toLowerCase()}) {
        if (${entity.name.toLowerCase()}Repository.existsById(id)) {
            ${entity.name.toLowerCase()}.setId(id);
            return ${entity.name.toLowerCase()}Repository.save(${entity.name.toLowerCase()});
        }
        throw new RuntimeException("${entity.name} not found with id: " + id);
    }
    
    public void deleteById(${idType} id) {
        ${entity.name.toLowerCase()}Repository.deleteById(id);
    }
    
    public boolean existsById(${idType} id) {
        return ${entity.name.toLowerCase()}Repository.existsById(id);
    }
    
    public long count() {
        return ${entity.name.toLowerCase()}Repository.count();
    }
}`;
  }

  private generateControllers(): { [key: string]: string } {
    const controllers: { [key: string]: string } = {};
    
    this.entities.forEach(entity => {
      controllers[`${entity.name}Controller.java`] = this.generateControllerCode(entity);
    });

    return controllers;
  }

  private generateControllerCode(entity: SpringEntity): string {
    const packageName = this.projectName.toLowerCase();
    const idType = entity.attributes.find(attr => attr.isId)?.type || 'Long';

    return `package ${packageName}.controller;

import ${packageName}.model.${entity.name};
import ${packageName}.service.${entity.name}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/${entity.name.toLowerCase()}s")
@CrossOrigin(origins = "*")
public class ${entity.name}Controller {
    
    @Autowired
    private ${entity.name}Service ${entity.name.toLowerCase()}Service;
    
    @GetMapping
    public ResponseEntity<List<${entity.name}>> getAll${entity.name}s() {
        List<${entity.name}> ${entity.name.toLowerCase()}s = ${entity.name.toLowerCase()}Service.findAll();
        return ResponseEntity.ok(${entity.name.toLowerCase()}s);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<${entity.name}> get${entity.name}ById(@PathVariable ${idType} id) {
        Optional<${entity.name}> ${entity.name.toLowerCase()} = ${entity.name.toLowerCase()}Service.findById(id);
        return ${entity.name.toLowerCase()}.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<${entity.name}> create${entity.name}(@RequestBody ${entity.name} ${entity.name.toLowerCase()}) {
        ${entity.name} saved${entity.name} = ${entity.name.toLowerCase()}Service.save(${entity.name.toLowerCase()});
        return ResponseEntity.status(HttpStatus.CREATED).body(saved${entity.name});
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<${entity.name}> update${entity.name}(@PathVariable ${idType} id, @RequestBody ${entity.name} ${entity.name.toLowerCase()}) {
        try {
            ${entity.name} updated${entity.name} = ${entity.name.toLowerCase()}Service.update(id, ${entity.name.toLowerCase()});
            return ResponseEntity.ok(updated${entity.name});
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete${entity.name}(@PathVariable ${idType} id) {
        if (${entity.name.toLowerCase()}Service.existsById(id)) {
            ${entity.name.toLowerCase()}Service.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> get${entity.name}Count() {
        long count = ${entity.name.toLowerCase()}Service.count();
        return ResponseEntity.ok(count);
    }
}`;
  }

  private generateApplicationProperties(): string {
    return `# Database Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password

# JPA Configuration
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# H2 Console (for development)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Server Configuration
server.port=8080

# Logging
logging.level.${this.projectName.toLowerCase()}=DEBUG
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE`;
  }

  private generatePomXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>${this.projectName.toLowerCase()}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${this.projectName}</name>
    <description>Generated Spring Boot application from UML diagram</description>
    <properties>
        <java.version>11</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  private generateMainApplication(): string {
    return `package ${this.projectName.toLowerCase()};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${this.projectName}Application {
    public static void main(String[] args) {
        SpringApplication.run(${this.projectName}Application.class, args);
    }
}`;
  }

  private mapUmlTypeToJava(umlType: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'String',
      'int': 'Integer',
      'integer': 'Integer',
      'long': 'Long',
      'float': 'Float',
      'double': 'Double',
      'boolean': 'Boolean',
      'date': 'LocalDateTime',
      'datetime': 'LocalDateTime',
      'timestamp': 'LocalDateTime'
    };

    return typeMap[umlType.toLowerCase()] || 'String';
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
