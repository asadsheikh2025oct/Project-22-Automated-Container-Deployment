# Automated Container Deployment Project

This project demonstrates a fully automated CI/CD pipeline using **Azure DevOps**, **Azure Container Registry (ACR)**, and **Azure App Service (Web App for Containers)**. It automates the building of a Dockerized web application and deploys it to a cloud environment.

## 🚀 Architecture Overview

The workflow follows these stages:
1. **Source Control**: Code is managed in a Git repository.
2. **CI Stage (Build)**: Azure Pipelines triggers on changes to the `main` branch, builds the Docker image, and pushes it to ACR.
3. **CD Stage (Deploy)**: The pipeline updates the Azure Web App to pull the latest image tag from the registry.



---

## 🛠️ Tech Stack
* **Runtime**: Node.js (Application running on port 3000).
* **Containerization**: Docker.
* **CI/CD**: Azure Pipelines.
* **Registry**: Azure Container Registry (`myacrregistry20260326.azurecr.io`).
* **Hosting**: Azure App Service (`myappname20260326`).

---

## 📋 Prerequisites

Before running the pipeline, ensure the following are configured in Azure:
* **Service Connection**: A Docker Registry service connection in Azure DevOps named `myacrregistry20260326`.
* **Azure Resource Manager Connection**: An ARM service connection for the subscription `f2f1d6df-9422-48cb-abf1-0a4eb095ad4a`.
* **ACR Admin User**: The Admin user must be enabled in the Container Registry to support credential-based authentication.

---

## ⚙️ Configuration & Environment Variables

To ensure successful image pulls and application startup, the following **Environment Variables** must be set in the Web App:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `WEBSITES_PORT` | `3000` | Tells Azure which port the container listens on. |
| `DOCKER_REGISTRY_SERVER_URL` | `https://myacrregistry20260326.azurecr.io` | The registry endpoint. |
| `DOCKER_REGISTRY_SERVER_USERNAME` | `myacrregistry20260326` | ACR Admin username. |
| `DOCKER_REGISTRY_SERVER_PASSWORD` | `[Your-ACR-Key]` | ACR Admin password/key. |
| `acrUseManagedIdentityCreds` | `false` | Set to false to prioritize Admin credentials over MSI. |

---

## 📝 Deployment Logs Reference

During the setup phase, we resolved a critical **ImagePullUnauthorizedFailure**. This was fixed by:
1. Aligning the `imageRepository` name to be consistent across build and deploy steps (`my-web-app-images-repo`).
2. Manually providing registry credentials in the App Service environment variables to bypass Managed Identity propagation delays.
3. Using the **"Replace Instance"** diagnostic tool to clear cached "Blocked" states on the App Service plan.

---

## 🛠️ How to Run
1. Push changes to the `main` branch.
2. Monitor the **Build and push stage** in Azure DevOps.
3. Verify the deployment by checking the **Log Stream** in the Azure Portal to see the successful "WarmUpProbe".

---

## ⚠️ Challenges & Solutions

The deployment phase of this project encountered several critical "roadblocks" that prevented the container from starting. Below is a summary of the issues and the specific technical solutions used to resolve them.

---

### 1. Image Repository Naming Mismatch
* **The Problem**: The Azure DevOps `Docker@2` task was defaulting to a repository name based on the Git project (`Project-22-Automated-Container-Deployment`), while the Web App was configured to look for a different string (`my-web-app-images-repo`).
* **The Symptom**: The pipeline would report a "Success," but the Web App would fail with an `ImageNotFound` error because the names didn't match.
* **The Solution**: Hard-coded the `imageRepository` variable in the YAML file and explicitly passed it to both the **Build** and **Deploy** tasks to ensure 100% alignment.

### 2. Image Pull Unauthorized Failure (RBAC/MSI)
* **The Problem**: The Web App attempted to use a **Managed Identity** (MSI) to pull the image from the Azure Container Registry, but the "AcrPull" permissions had not fully propagated or were misconfigured.
* **The Symptom**: Logs showed `ImagePullUnauthorizedFailure` and the error message: `Image pull failed with forbidden or unauthorized. Check registry credentials.`
* **The Solution**: Bypassed the Managed Identity by enabling the **Admin User** in ACR and manually adding the registry credentials (`DOCKER_REGISTRY_SERVER_USERNAME` and `PASSWORD`) to the App Service Environment Variables.

### 3. Container "Cold Start" Blocked State
* **The Problem**: After multiple failed pull attempts, Azure App Service placed the site into a "Blocked" state to protect the infrastructure from constant crash looping.
* **The Symptom**: The Log Stream became silent, and new deployment attempts were ignored, showing the message: `Site is blocked due to multiple, consecutive cold start failures.`
* **The Solution**: Utilized the **"Replace Instance"** feature within the App Service **Diagnose and Solve Problems** (Repair) blade. This provisioned a fresh virtual worker with a clean cache, allowing the new credentials and image name to take effect immediately.

### 4. Port Binding Conflict
* **The Problem**: The container was running a Node.js application listening on port `3000`, but Azure Web Apps for Containers often defaults to port `80`.
* **The Symptom**: The container would start, but the "WarmUpProbe" would fail because Azure couldn't reach the app.
* **The Solution**: Added the `WEBSITES_PORT` environment variable and set it to `3000` to direct Azure’s internal load balancer to the correct container port.

---

## 🧠 Lessons Learned & Best Practices

Reflecting on the deployment challenges, these are the core takeaways for managing Azure Web App for Containers:

* **Case Sensitivity Matters**: Azure Container Registry and Docker are case-sensitive. Always use **lowercase** for `imageRepository` names to prevent mismatches between the build logs and the deployment configuration.
* **MSI Propagation Latency**: Managed Identities (MSI) are the most secure way to connect services, but they are not instantaneous. When a project needs to be live immediately, using **Admin Credentials** as a fallback is a reliable troubleshooting step.
* **Infrastructure "Memory"**: App Services can become "stuck" in a failed state due to internal platform caching. The **"Replace Instance"** or **"Check Container Health"** diagnostic tools are more powerful than a simple "Restart" because they force the app onto a fresh, un-cached environment.
* **Visibility is Key**: When the Portal's Log Stream is silent, the **Kudu (Advanced Tools)** engine provides the underlying Docker logs necessary to see the "real" reason for a pull failure.

---

## ✅ Pre-Deployment Checklist

Before triggering a new pipeline, verify these five items to ensure a "green" deployment:

1.  **YAML Alignment**: Ensure the `repository` name in your `Docker@2` task matches the `containers` string in your `AzureWebAppContainer@1` task exactly.
2.  **Access Keys**: If not using Managed Identity, verify that the **Admin user** is still enabled in the ACR "Access Keys" blade.
3.  **Port Configuration**: Confirm the `WEBSITES_PORT` environment variable matches the `EXPOSE` instruction in your `Dockerfile` (e.g., `3000`).
4.  **Service Connection**: Verify that the Service Connection ID in the YAML (`dockerRegistryServiceConnection`) matches the current ID in Azure DevOps Project Settings.
5.  **Clean State**: If the app has failed multiple times, use the **Diagnose and Solve Problems** tool to reset the instance before pushing new code.

---
