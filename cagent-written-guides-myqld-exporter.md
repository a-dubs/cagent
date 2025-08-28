## How to use this image

## Start a mysqld-exporter image

The simplest way to start a mysqld-exporter instance is to run it without connecting to a MySQL server. This provides basic exporter metrics:

```bash
docker run -d -p 9104:9104 dhi/mysqld-exporter:0.17
```

To connect to a MySQL server, provide connection parameters:

```bash
docker run -d -p 9104:9104 \
  -e MYSQLD_EXPORTER_PASSWORD=your_password \
  dhi/mysqld-exporter:0.17 \
  --mysqld.address=mysql-server:3306 \
  --mysqld.username=exporter_user
```

For a complete setup with MySQL server using Docker Compose:

```yaml
version: '3.8'
services:
  mysql:
    image: dhi/mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: testdb
      MYSQL_USER: exporter
      MYSQL_PASSWORD: exporterpass123
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 3

  mysqld-exporter:
    image: dhi/mysqld-exporter:0.17
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "9104:9104"
    environment:
      MYSQLD_EXPORTER_PASSWORD: exporterpass123
    command:
      - --mysqld.address=mysql:3306
      - --mysqld.username=exporter
      - --collect.global_status
      - --collect.global_variables
      - --collect.info_schema.processlist
      - --collect.info_schema.tables
```

## Common mysqld-exporter use cases

- **Basic metrics collection**: Run the exporter to collect basic mysqld_exporter metrics without connecting to MySQL
- **MySQL monitoring**: Connect to MySQL/MariaDB instances to collect comprehensive database metrics
- **Multi-instance monitoring**: Use with multiple MySQL servers by running separate exporter instances
- **Prometheus integration**: Configure as a scrape target in Prometheus for automated metric collection
- **Custom collector configuration**: Enable specific collectors based on monitoring requirements
- **Authentication-based monitoring**: Connect using MySQL users with appropriate monitoring privileges
- **Configuration file usage**: Use MySQL configuration files for connection parameters
- **Custom endpoints**: Configure custom listen addresses and telemetry paths for integration needs

## Non-hardened images vs. Docker Hardened Images

The Docker Hardened Image for mysqld-exporter provides the same functionality as the upstream Prometheus mysqld-exporter image but with enhanced security:

- **Security**: Built with minimal attack surface and near-zero known CVEs
- **Compliance**: Includes signed provenance and complete SBOM for supply chain security
- **Compatibility**: Maintains full compatibility with upstream mysqld-exporter, including the `/bin/mysqld_exporter` symlink
- **Base image**: Uses hardened Debian base instead of standard distributions
- **User permissions**: Runs as non-root user by default for enhanced security

The image supports all standard mysqld-exporter features including collectors, authentication methods, and configuration options. Command-line arguments and environment variables work identically to the upstream image.

## Migrate to a Docker Hardened Image

To migrate your application to a Docker Hardened Image, you must update your
Dockerfile. At minimum, you must update the base image in your existing
Dockerfile to a Docker Hardened Image. This and a few other common changes are
listed in the following table of migration notes.

| Item               | Migration note                                                                                                                                                                                                                                                                                                               |
|:-------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Base image         | Replace your base images in your Dockerfile with a Docker Hardened Image.                                                                                                                                                                                                                                                    |
| Package management | Non-dev images, intended for runtime, don't contain package managers. Use package managers only in images with a `dev` tag.                                                                                                                                                                                                  |
| Non-root user      | By default, non-dev images, intended for runtime, run as the nonroot user. Ensure that necessary files and directories are accessible to the nonroot user.                                                                                                                                                                   |
| Multi-stage build  | Utilize images with a `dev` tag for build stages and non-dev images for runtime. For binary executables, use a `static` image for runtime.                                                                                                                                                                                   |
| TLS certificates   | Docker Hardened Images contain standard TLS certificates by default. There is no need to install TLS certificates.                                                                                                                                                                                                           |
| Ports              | Non-dev hardened images run as a nonroot user by default. As a result, applications in these images can't bind to privileged ports (below 1024) when running in Kubernetes or in Docker Engine versions older than 20.10. To avoid issues, configure your application to listen on port 1025 or higher inside the container. |
| Entry point        | Docker Hardened Images may have different entry points than images such as Docker Official Images. Inspect entry points for Docker Hardened Images and update your Dockerfile if necessary.                                                                                                                                  |
| No shell           | By default, non-dev images, intended for runtime, don't contain a shell. Use dev images in build stages to run shell commands and then copy artifacts to the runtime stage.                                                                                                                                                  |

The following steps outline the general migration process.

1. Find hardened images for your app.

   A hardened image may have several variants. Inspect the image tags and find
   the image variant that meets your needs.

2. Update the base image in your Dockerfile.

   Update the base image in your application's Dockerfile to the hardened image
   you found in the previous step. For framework images, this is typically going
   to be an image tagged as `dev` because it has the tools needed to install
   packages and dependencies.

3. For multi-stage Dockerfiles, update the runtime image in your Dockerfile.

   To ensure that your final image is as minimal as possible, you should use a
   multi-stage build. All stages in your Dockerfile should use a hardened image.
   While intermediary stages will typically use images tagged as `dev`, your
   final runtime stage should use a non-dev image variant.

4. Install additional packages

   Docker Hardened Images contain minimal packages in order to reduce the
   potential attack surface. You may need to install additional packages in your
   Dockerfile. Inspect the image variants to identify which packages are already
   installed.

   Only images tagged as `dev` typically have package managers. You should use a
   multi-stage Dockerfile to install the packages. Install the packages in the
   build stage that uses a `dev` image. Then, if needed, copy any necessary
   artifacts to the runtime stage that uses a non-dev image.

   For Alpine-based images, you can use `apk` to install packages. For
   Debian-based images, you can use `apt-get` to install packages.

## Troubleshooting migration

The following are common issues that you may encounter during migration.

### General debugging

The hardened images intended for runtime don't contain a shell nor any tools for
debugging. The recommended method for debugging applications built with Docker
Hardened Images is to use [Docker
Debug](https://docs.docker.com/reference/cli/docker/debug/) to attach to these
containers. Docker Debug provides a shell, common debugging tools, and lets you
install other tools in an ephemeral, writable layer that only exists during the
debugging session.

### Permissions

By default image variants intended for runtime, run as the nonroot user. Ensure
that necessary files and directories are accessible to the nonroot user. You may
need to copy files to different directories or change permissions so your
application running as the nonroot user can access them.

### Privileged ports

Non-dev hardened images run as a nonroot user by default. As a result,
applications in these images can't bind to privileged ports (below 1024) when
running in Kubernetes or in Docker Engine versions older than 20.10. To avoid
issues, configure your application to listen on port 1025 or higher inside the
container, even if you map it to a lower port on the host. For example, `docker
run -p 80:8080 my-image` will work because the port inside the container is 8080,
and `docker run -p 80:81 my-image` won't work because the port inside the
container is 81.

### No shell

By default, image variants intended for runtime don't contain a shell. Use `dev`
images in build stages to run shell commands and then copy any necessary
artifacts into the runtime stage. In addition, use Docker Debug to debug
containers with no shell.

### Entry point

Docker Hardened Images may have different entry points than images such as
Docker Official Images. Use `docker inspect` to inspect entry points for Docker
Hardened Images and update your Dockerfile if necessary.