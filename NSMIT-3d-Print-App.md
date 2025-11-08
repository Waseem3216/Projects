# NSMIT 3D Printing Inventory App Display

## Introduction
The **NSMIT 3D Printing Inventory App** is a custom, mobile-friendly SaaS solution for efficient inventory management in a university makerspace or technical department. Built with **Microsoft Power Apps (modern FX front-end)** and backed by **two SharePoint Lists**, the app replaces cumbersome manual entry with an automated, streamlined interface. Integrations with **Microsoft 365** and **Azure Services** provide secure access and real-time data updates.

---

## App Walkthrough

### App Home Screen
The home screen serves as the main dashboard with two large navigation buttons: **Materials** and **Equipment**. The touch-optimized UI (UH branding) lets users quickly start inventory tasks by choosing the relevant category.

### Materials Inventory List
Selecting **Materials** shows a searchable grid of filament/material types, each with a real image and manufacturer name. A search bar enables fast filtering—ideal for large inventories—while visual tiles help staff and students quickly select items to update or audit.

### Material Color Quantity Management
Choosing a material opens a list of its **color variations**. Each color shows a quantity field with **plus/minus** controls and direct edit support, reducing errors and speeding updates. Changes **sync instantly to SharePoint**, keeping inventory current across devices.

### Equipment Inventory List
Selecting **Equipment** displays a similar grid for printer parts and accessories (e.g., extruders, print beds). Each item shows a photo and model/size label. The search bar supports quick filtering across large equipment sets.

### Edit Equipment Quantity
Clicking an equipment tile opens a detail view to adjust **current stock**. Users can increase/decrease via **plus/minus**, enter values directly, and see **last modified timestamp** plus the **user** who made the change—supporting accountability and an auditable history.

### Success Confirmation
After updates, a bold confirmation screen shows **“SUCCESS!”** with a green checkmark, clearly signaling that changes were saved to the cloud. Bottom navigation offers **Home**, **Log out**, and other shortcuts to streamline multi-update workflows.

### App Exit and Branding
Returning home provides a clear way to exit the app. **University of Houston** branding is prominent, and bottom navigation ensures users are never lost and can end sessions confidently.

---

## Technical Overview
- **Front-End:** Microsoft Power Apps (modern FX) for a responsive, mobile-friendly UI  
- **Back-End:** Two **SharePoint Lists** (“Materials” & “Equipment”) for real-time, cloud-based inventory  
- **Authentication:** Integrated with **Microsoft 365** for secure, role-based access  
- **Cloud Sync:** **Azure Services** for reliable storage and always-up-to-date information  
- **Automation:** Quantity updates, change logging (timestamps + user), and visual feedback  
- **Accessibility:** Desktop and mobile friendly for anywhere inventory management

---

## Key Features
- **Automated Inventory Tracking:** Instant, organization-wide updates minimize manual errors  
- **Visual, Intuitive Interface:** Real images and clear navigation support both technical and non-technical staff  
- **Real-Time Search & Filtering:** Find any material/equipment in seconds—even in large catalogs  
- **Auditable Change History:** Every update stored with date/time and user for transparency  
- **Mobile-First:** Optimized for tablets and phones to manage inventory on the go  
- **Easy Extension:** Add new materials, colors, or equipment via SharePoint without redeploying the app

---

## Software Used
- Microsoft Power Apps  
- Microsoft SharePoint  
- Microsoft 365  
- Azure Services

---

**Project Created by:** *Waseem Sayyedahmad*  
**Timeline:** *01/17/2025 – 02/20/2025*
