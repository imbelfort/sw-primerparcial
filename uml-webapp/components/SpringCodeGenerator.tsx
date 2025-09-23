"use client";

import React, { useState } from 'react';
import { SpringCodeGenerator, GeneratedCode } from '../lib/springCodeGenerator';
import * as joint from "jointjs";
import JSZip from 'jszip';

interface SpringCodeGeneratorProps {
  graph: joint.dia.Graph;
  onClose: () => void;
}

export function SpringCodeGeneratorComponent({ graph, onClose }: SpringCodeGeneratorProps) {
  const [projectName, setProjectName] = useState('GeneratedSpringApp');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generator = new SpringCodeGenerator(projectName);
      const code = generator.generateFromDiagram(graph);
      setGeneratedCode(code);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(`¡Código generado exitosamente! Se generaron ${Object.keys(code.entities).length} entidades.`);
      }, 100);
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Error al generar el código. Por favor, verifica que el diagrama tenga clases válidas.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;

    // Crear un archivo ZIP con todos los archivos
    const zip = new JSZip();
    
    // Mostrar mensaje de inicio
    alert('Generando archivo ZIP...');
    
    // Crear estructura de directorios
    const packageName = projectName.toLowerCase();
    
    // Agregar archivos de entidades
    Object.entries(generatedCode.entities).forEach(([filename, content]) => {
      zip.file(`src/main/java/${packageName}/model/${filename}`, content);
    });
    
    // Agregar archivos de repositorios
    Object.entries(generatedCode.repositories).forEach(([filename, content]) => {
      zip.file(`src/main/java/${packageName}/repository/${filename}`, content);
    });
    
    // Agregar archivos de servicios
    Object.entries(generatedCode.services).forEach(([filename, content]) => {
      zip.file(`src/main/java/${packageName}/service/${filename}`, content);
    });
    
    // Agregar archivos de controladores
    Object.entries(generatedCode.controllers).forEach(([filename, content]) => {
      zip.file(`src/main/java/${packageName}/controller/${filename}`, content);
    });
    
    // Agregar archivos de configuración
    zip.file(`src/main/java/${packageName}/${projectName}Application.java`, generatedCode.mainApplication);
    zip.file('src/main/resources/application.properties', generatedCode.applicationProperties);
    zip.file('pom.xml', generatedCode.pomXml);
    
    // Agregar archivos adicionales del proyecto
    zip.file('README.md', generateReadme(projectName, Object.keys(generatedCode.entities).length));
    zip.file('.gitignore', generateGitignore());
    zip.file('src/main/resources/static/index.html', generateIndexHtml());
    zip.file('src/test/java/ApplicationTests.java', generateApplicationTests(projectName));
    
    // Generar y descargar el ZIP
    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mostrar mensaje de éxito
      alert(`¡Archivo ZIP descargado exitosamente! Nombre: ${projectName}.zip`);
    });
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReadme = (projectName: string, entityCount: number): string => {
    return `# ${projectName}

Proyecto Spring Boot generado automáticamente desde un diagrama UML.

## Características

- **Entidades**: ${entityCount} entidades JPA
- **Base de datos**: H2 en memoria
- **API REST**: Endpoints completos para todas las entidades
- **Arquitectura**: 4 capas (Modelo, Repositorio, Servicio, Controlador)

## Cómo ejecutar

1. **Requisitos**:
   - Java 11 o superior
   - Maven 3.6 o superior

2. **Ejecutar la aplicación**:
   \`\`\`bash
   mvn spring-boot:run
   \`\`\`

3. **Acceder a la aplicación**:
   - API REST: http://localhost:8080/api/
   - Consola H2: http://localhost:8080/h2-console
   - Página principal: http://localhost:8080/

## Estructura del proyecto

\`\`\`
src/
├── main/
│   ├── java/
│   │   └── ${projectName.toLowerCase()}/
│   │       ├── model/          # Entidades JPA
│   │       ├── repository/     # Repositorios de datos
│   │       ├── service/        # Lógica de negocio
│   │       ├── controller/     # Controladores REST
│   │       └── ${projectName}Application.java
│   └── resources/
│       ├── application.properties
│       └── static/
│           └── index.html
└── test/
    └── java/
        └── ApplicationTests.java
\`\`\`

## Endpoints disponibles

- \`GET /api/{entidad}s\` - Obtener todas las entidades
- \`GET /api/{entidad}s/{id}\` - Obtener entidad por ID
- \`POST /api/{entidad}s\` - Crear nueva entidad
- \`PUT /api/{entidad}s/{id}\` - Actualizar entidad
- \`DELETE /api/{entidad}s/{id}\` - Eliminar entidad
- \`GET /api/{entidad}s/count\` - Contar entidades

## Base de datos

La aplicación usa H2 en memoria con las siguientes configuraciones:
- **URL**: jdbc:h2:mem:testdb
- **Usuario**: sa
- **Contraseña**: password
- **Consola**: http://localhost:8080/h2-console

## Desarrollo

Para desarrollar localmente:

1. Clonar el repositorio
2. Ejecutar \`mvn clean install\`
3. Ejecutar \`mvn spring-boot:run\`
4. Abrir http://localhost:8080

## Tecnologías utilizadas

- Spring Boot 2.7.0
- Spring Data JPA
- H2 Database
- Maven
- Java 11

---
*Proyecto generado automáticamente por el Generador de Código Spring Boot*
`;
  };

  const generateGitignore = (): string => {
    return `HELP.md
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/

### Logs ###
*.log
logs/

### OS ###
.DS_Store
Thumbs.db
`;
  };

  const generateIndexHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spring Boot API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #28a745;
        }
        .method {
            font-weight: bold;
            color: #28a745;
        }
        .url {
            font-family: monospace;
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .description {
            color: #6c757d;
            margin-top: 5px;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .info h3 {
            margin-top: 0;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Spring Boot API</h1>
        
        <div class="info">
            <h3>📋 Información del Proyecto</h3>
            <p><strong>Proyecto:</strong> ${projectName}</p>
            <p><strong>Base de datos:</strong> H2 en memoria</p>
            <p><strong>Consola H2:</strong> <a href="/h2-console" target="_blank">/h2-console</a></p>
            <p><strong>Usuario:</strong> sa | <strong>Contraseña:</strong> password</p>
        </div>

        <h2>🔗 Endpoints Disponibles</h2>
        
        <div class="endpoint">
            <div class="method">GET</div>
            <div class="url">/api/{entidad}s</div>
            <div class="description">Obtener todas las entidades</div>
        </div>
        
        <div class="endpoint">
            <div class="method">GET</div>
            <div class="url">/api/{entidad}s/{id}</div>
            <div class="description">Obtener entidad por ID</div>
        </div>
        
        <div class="endpoint">
            <div class="method">POST</div>
            <div class="url">/api/{entidad}s</div>
            <div class="description">Crear nueva entidad</div>
        </div>
        
        <div class="endpoint">
            <div class="method">PUT</div>
            <div class="url">/api/{entidad}s/{id}</div>
            <div class="description">Actualizar entidad</div>
        </div>
        
        <div class="endpoint">
            <div class="method">DELETE</div>
            <div class="url">/api/{entidad}s/{id}</div>
            <div class="description">Eliminar entidad</div>
        </div>
        
        <div class="endpoint">
            <div class="method">GET</div>
            <div class="url">/api/{entidad}s/count</div>
            <div class="description">Contar entidades</div>
        </div>

        <div class="info">
            <h3>💡 Cómo usar</h3>
            <p>Reemplaza <code>{entidad}</code> con el nombre de tu entidad en minúsculas (ej: usuarios, productos, etc.)</p>
            <p>Los endpoints están disponibles en: <code>http://localhost:8080/api/</code></p>
        </div>
    </div>
</body>
</html>`;
  };

  const generateApplicationTests = (projectName: string): string => {
    return `package ${projectName.toLowerCase()};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ${projectName}ApplicationTests {

    @Test
    void contextLoads() {
        // Test que verifica que el contexto de Spring se carga correctamente
    }

}
`;
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.java')) {
      return (
        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    } else if (filename.endsWith('.xml')) {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (filename.endsWith('.properties')) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generador de Código Spring Boot</h2>
              <p className="text-sm text-gray-500">Genera código Java listo para ejecutar desde tu diagrama UML</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Configuración */}
          <div className="w-80 border-r border-gray-200 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Configuración del Proyecto</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="MiProyectoSpring"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Capas Generadas</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Modelo (Entidades JPA)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Repositorio (Data Access)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Servicio (Lógica de Negocio)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">Controlador (REST API)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Características</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Anotaciones JPA completas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Base de datos H2 en memoria</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>API REST completa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Listo para ejecutar</span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generar Código</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel derecho - Archivos generados */}
          <div className="flex-1 flex flex-col">
            {generatedCode ? (
              <>
                {/* Header de archivos */}
                <div className="p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Archivos Generados</h3>
                    <button
                      onClick={handleDownloadAll}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Todo
                    </button>
                  </div>
                </div>

                {/* Lista de archivos */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {/* Entidades */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Entidades (Modelo)</h4>
                      <div className="space-y-2">
                        {Object.keys(generatedCode.entities).map((filename) => (
                          <div
                            key={filename}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedFile === filename
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedFile(filename)}
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(filename)}
                              <span className="text-sm font-medium text-gray-900">{filename}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(filename, generatedCode.entities[filename]);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Repositorios */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Repositorios</h4>
                      <div className="space-y-2">
                        {Object.keys(generatedCode.repositories).map((filename) => (
                          <div
                            key={filename}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedFile === filename
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedFile(filename)}
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(filename)}
                              <span className="text-sm font-medium text-gray-900">{filename}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(filename, generatedCode.repositories[filename]);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Servicios */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Servicios</h4>
                      <div className="space-y-2">
                        {Object.keys(generatedCode.services).map((filename) => (
                          <div
                            key={filename}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedFile === filename
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedFile(filename)}
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(filename)}
                              <span className="text-sm font-medium text-gray-900">{filename}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(filename, generatedCode.services[filename]);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Controladores */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Controladores</h4>
                      <div className="space-y-2">
                        {Object.keys(generatedCode.controllers).map((filename) => (
                          <div
                            key={filename}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedFile === filename
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedFile(filename)}
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(filename)}
                              <span className="text-sm font-medium text-gray-900">{filename}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(filename, generatedCode.controllers[filename]);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Archivos de configuración */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Configuración</h4>
                      <div className="space-y-2">
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedFile === 'pom.xml'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedFile('pom.xml')}
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon('pom.xml')}
                            <span className="text-sm font-medium text-gray-900">pom.xml</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile('pom.xml', generatedCode.pomXml);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedFile === 'application.properties'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedFile('application.properties')}
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon('application.properties')}
                            <span className="text-sm font-medium text-gray-900">application.properties</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile('application.properties', generatedCode.applicationProperties);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Genera tu código Spring Boot</h3>
                  <p className="text-gray-600">Configura el nombre del proyecto y haz clic en "Generar Código"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
