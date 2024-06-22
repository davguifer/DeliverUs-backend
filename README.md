# DeliverUs - Proyecto

Este proyecto ha sido desarrollado por David Guillén, Javier Gutiérrez y Javier Lozano. Corresponde a la asignatura de Introducción a la Ingeniería del Software y Sistemas de Información II (IISSI 2) de Ingeniería del Software en la Universidad de Sevilla.

# DeliverUS - Requisitos del Proyecto

## Introducción
DeliverUS es una empresa ficticia cuyo negocio se centra en la entrega de alimentos de terceros (restaurantes) a clientes. Para este fin, se nos solicita desarrollar los productos de software necesarios que, con suerte, impulsarán la empresa. Después de entrevistar a los propietarios del producto y a algunos interesados, se han acordado los objetivos y requisitos generales, como se describe en este documento.

## Objetivo General: Gestionar pedidos de clientes a restaurantes
El software debe permitir a los clientes pedir productos a los restaurantes. Para ello se han identificado los siguientes objetivos:

* Objetivo 1: Gestión de restaurantes
* Objetivo 2: Gestión de productos de los restaurantes
* Objetivo 3: Gestión de pedidos de los restaurantes
* Objetivo 4: Gestión de pedidos de los clientes
* Objetivo 5: Gestión de usuarios

## Requisitos de Información
### RI-1: Usuarios
DeliverUS espera dos tipos de usuarios: propietarios de restaurantes y clientes. Se debe almacenar la siguiente información: Nombre, apellido, correo electrónico, número de teléfono, imagen de avatar, dirección y código postal. Para propósitos de inicio de sesión y autenticación, también se debe almacenar una contraseña, un token y una fecha de expiración del token.

### RI-2: Restaurantes
Los propietarios gestionan restaurantes. Se debe almacenar la siguiente información: nombre, descripción, dirección, código postal, URL, correo electrónico, número de teléfono, logotipo, imagen principal (servirá como imagen de fondo del restaurante), costos de envío (predeterminado para pedidos realizados a este restaurante), tiempo promedio de servicio en minutos (que se calculará a partir del registro de pedidos), estado. El estado de un restaurante representa si está aceptando pedidos, actualmente no disponible, o cerrado temporal o permanentemente. 
Hay algunas categorías de restaurantes predefinidas en el sistema, por lo que el restaurante pertenecerá a una categoría de restaurante.

### RI-3: Productos
Los productos son vendidos por restaurantes. Cada producto pertenece a un restaurante. Se debe almacenar la siguiente información: nombre, descripción, precio, imagen, orden y disponibilidad. La orden está destinada a fines de clasificación que podrían ser definidos por el propietario para que los productos se ordenen según sus intereses.

Hay algunas categorías de productos predefinidas en el sistema, por lo que el producto pertenecerá a una categoría de producto.

### RI-4: Pedidos
Los pedidos son realizados por clientes. Cada pedido incluirá un conjunto de productos de un restaurante en particular. Los pedidos no pueden incluir productos de más de un restaurante. Se debe almacenar la siguiente información: fecha de creación (cuando el cliente realiza el pedido), fecha de inicio (cuando un restaurante acepta el pedido), fecha de envío (cuando el pedido sale del restaurante) y fecha de entrega (cuando el cliente recibe el pedido), precio total de los productos incluidos, la dirección donde debe entregarse y los costos de envío. Por lo tanto, cada pedido puede estar en uno de los siguientes estados: 'pendiente', 'en proceso', 'enviado', 'entregado'.

El sistema debe almacenar la cantidad de cada producto incluido en el pedido y el precio unitario de cada producto en el momento de la realización del pedido.

## Diagrama de Clases Propuesto para el Diseño
A partir de los requisitos de información y objetivos descritos, se propone el siguiente diagrama de clases:

![DeliverUS-EntityDiagram drawio (3)](https://user-images.githubusercontent.com/19324988/155700850-bb7817fb-8818-440b-97cb-4fbd33787f20.png)

## Reglas de Negocio
* RN1: Si el precio total de un pedido es mayor de 10€ los costos de envío serán 0€ (envío gratuito).
* RN2: Un pedido solo puede incluir productos de un restaurante.
* RN3: Una vez que se realiza un pedido, no puede ser modificado.

## Requisitos Funcionales
### Requisitos Funcionales del Cliente:
Como cliente, el sistema debe proporcionar las siguientes funcionalidades:
#### RF1: Listado de restaurantes
Los clientes podrán consultar todos los restaurantes.
#### RF2: Detalles del restaurante y menú
Los clientes podrán consultar los detalles de los restaurantes y los productos que ofrecen.
#### RF3: Agregar, editar y eliminar productos en un nuevo pedido
Un cliente puede agregar varios productos y varias unidades de un producto a un nuevo pedido. Antes de confirmar, el cliente puede editar y eliminar productos.
#### RF4: Confirmar o descartar un nuevo pedido
Si se confirma un pedido, se crea con el estado _pendiente_. Los costos de envío deben seguir la RN1: _Los pedidos superiores a 10€ no tienen tarifa de servicio_. Un pedido se relaciona automáticamente con el cliente que lo creó.
Si se descarta un pedido, no se crea nada.
#### RF5: Listar mis pedidos confirmados
Un cliente podrá consultar sus pedidos confirmados, ordenados del más reciente al más antiguo.
#### RF6: Mostrar detalles del pedido
Un cliente podrá consultar sus pedidos. El sistema debe proporcionar todos los detalles de un pedido, incluidos los productos pedidos y sus precios.
#### RF7: Mostrar los 3 mejores productos
Los clientes podrán consultar los 3 mejores productos de todos los restaurantes. Los productos principales son los más populares, en otras palabras, los más vendidos.
#### RF8: Editar/eliminar pedido
Si el pedido está en el estado 'pendiente', el cliente puede editar o eliminar los productos incluidos o eliminar todo el pedido. La dirección de entrega también se puede modificar en el estado 'pendiente'.
Si el pedido está en el estado 'enviado' o 'entregado' no se permite la edición.

### Requisitos Funcionales del Propietario:
Como propietario de un restaurante, el sistema debe proporcionar las siguientes funcionalidades:
#### RF1: Agregar, listar, editar y eliminar restaurantes
Los restaurantes están relacionados con un propietario, por lo que los propietarios pueden realizar estas operaciones en los restaurantes que poseen. Si un propietario crea un restaurante, se relacionará automáticamente con él. Si se elimina un restaurante, también se deben eliminar todos sus productos.
#### RF2: Agregar, listar, editar y eliminar productos
Un propietario puede crear, leer, actualizar y eliminar los productos relacionados con cualquiera de sus restaurantes.
#### RF3: Listar pedidos de un restaurante
Un propietario podrá inspeccionar los pedidos de cualquiera de los restaurantes que posee. El pedido debe incluir los productos relacionados.
#### RF4: Cambiar el estado de un pedido
Un propietario puede cambiar el estado de un pedido. Los estados pueden cambiar de: _pendiente_ a _en proceso_, de _en proceso_ a _enviado_, y finalmente de _enviado_ a _entregado_.
#### RF5: Mostrar un tablero que incluya algunos análisis comerciales:
 #pedidosDeAyer, #pedidosPendientes, #pedidosServidosHoy, #facturadoHoy (€)

## Requisitos No Funcionales
### Portabilidad
El sistema debe proporcionar a los usuarios la posibilidad de ser accedido y ejecutado a través de los sistemas operativos más populares para dispositivos móviles y de escritorio.

### Seguridad
El backend debe incluir medidas básicas para evitar la explotación de vulnerabilidades generales de seguridad, tales como: inyección de SQL, ContentSecurityPolicy, CrossOriginEmbedderPolicy, CrossOriginOpenerPolicy, CrossOriginResourcePolicy, dnsPrefetchControl, expectCt, frameguard, hidePoweredBy, helmet.hsts, ieNoOpen, noSniff, originAgentCluster, permittedCrossDomainPolicies, referrerPolicy, xssFilter.

Para propósitos de inicio de sesión y autenticación, también se debe almacenar una contraseña, un token y una fecha de expiración del token (estrategia de autenticación con token) para los usuarios.

Nota: Este tema no se centra en cuestiones de seguridad, pero utilizaremos bibliotecas creadas por expertos en ciberseguridad que nos ayudarán a incluir estas medidas. En el ecosistema de Node.js, Sequelize incluye sanitización de datos y otras medidas para evitar ataques de inyección de SQL y utilizaremos el paquete helmet para el resto de posibles vulnerabilidades de seguridad al publicar servicios REST.

### Escalabilidad
El sistema debe utilizar un conjunto de tecnologías que puedan desplegarse en más de una máquina, listas para la escalabilidad horizontal.

## Arquitectura Propuesta
Una vez que los arquitectos de software de nuestra empresa han analizado los requisitos, se propone la siguiente arquitectura general:
1. Modelo de arquitectura cliente-servidor.
2. Desarrollo independiente del frontend y backend.
3. Un desarrollo de frontend para cada tipo de usuario (Clientes y Propietarios).

Además, estos arquitectos proponen el siguiente stack tecnológico:
1. Backend:
   1. Base de datos relacional, servidor Mariadb. Puede desplegarse en una máquina distinta a donde se desplieguen el resto de subsistemas.
   2. Lógica de aplicación del backend de DeliverUS desarrollada en servidor de aplicaciones Node.js que publica funcionalidades como servicios RESTful con la ayuda del framework Express.js.
2. Frontend:
   1. Clientes basados en React-native para ambos frontends, desplegables como Apps para Android, iOS o web.
   1. App DeliverUS-Owner para las funcionalidades destinadas a los propietarios de restaurantes.
   3. App DeliverUS-Customer para las funcionalidades destinadas a los clientes.


# Pasos para el despliegue del backend:
1. Clona tu repositorio privado en tu entorno de desarrollo local abriendo VSCode y clonándolo abriendo la paleta de comandos (Ctrl+Shift+P o F1) y `Git clone` este repositorio, o usando la terminal y ejecutando:

```
git clone <url> 
```

Puede ser necesario configurar tu nombre de usuario de GitHub ejecutando los siguientes comandos en tu terminal:

```bash
git config --global user.name "NOMBRE_APELLIDO"
git config --global user.email "MI_NOMBRE@ejemplo.com" 
```

En caso de que se te pregunte si confías en el autor, por favor selecciona sí.

Configura tu archivo de entorno. Es necesario crear una copia del archivo `.env.example`, nombrarlo `.env` e incluir tus variables de entorno, especialmente tu nombre de usuario y contraseña de la base de datos.

Instala las dependencias. Ejecuta 
``` npm install ``` 
para descargar e instalar los paquetes en la carpeta actual del proyecto.

Verifica y ejecuta el servidor de MariaDB.

**Windows:**
- Si está instalado como servicio, ejecuta `services.msc` y inicia el servicio de MariaDB.
- Si está instalado como binario, localiza el binario de MariaDB y arráncalo.

**MacOS:**
mysql.server start
Ejecuta migraciones y sembradoras. Puedes utilizar la tarea configurada previamente abriendo la paleta de comandos Command Palette (Ctrl+Shift+P o F1) Tasks: run task y selecciona Rebuild database.

Finalmente, ejecuta `npm start`.

