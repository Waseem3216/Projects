<!-- Hero / Header -->
<p align="center">
  <img src="images/home_page.png" alt="NSMIT 3D Printing Inventory App - Home" width="900">
</p>

<h1 align="center">NSMIT 3D Printing Inventory App</h1>

<p align="center">
  <em>Mobile-first inventory for makerspaces - fast, visual, auditable.</em>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/App-Mobile%20First-2ea44f?style=for-the-badge" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Stack-Power%20Apps%20%7C%20SharePoint%20%7C%20Azure-0d6efd?style=for-the-badge" /></a>
  <a href="#screens"><img src="https://img.shields.io/badge/UI-Modern%20FX-6f42c1?style=for-the-badge" /></a>
  <a href="#audit"><img src="https://img.shields.io/badge/Security-Role%20Based-20c997?style=for-the-badge" /></a>
</p>

<!-- Quick Nav -->
<p align="center">
  <a href="#overview">Overview</a> • 
  <a href="#features">Features</a> • 
  <a href="#screens">Screens</a> • 
  <a href="#tech-stack">Tech Stack</a> • 
  <a href="#how-it-works">How It Works</a> • 
  <a href="#deployment">Deployment</a> • 
  <a href="#credits">Credits</a>
</p>

---

## Overview
The **NSMIT 3D Printing Inventory App** is a custom, mobile-friendly SaaS built with **Microsoft Power Apps (modern FX)**, backed by **SharePoint Lists** and integrated with **Microsoft 365** and **Azure**. It replaces error-prone manual entry with a **touch-optimized interface**, **instant cloud syncing**, and **auditable change history** - perfect for a university makerspace or technical department.

> **Use case**: Track filaments (by brand and color) and equipment/parts (extruders, beds, etc.) with search, quick +/– updates, and a clean success flow.

---

## ✨ Features
- **Automated Inventory Tracking**  
  Real-time updates across devices; reduce manual errors and duplicate entry.

- **Visual, Intuitive Interface**  
  Real photos, tiles, clear labels — approachable for both technical and non-technical users.

- **Smart Search & Filters**  
  Find anything in seconds, even in large catalogs.

- **Auditable Change History** <a id="audit"></a>  
  Each change logs timestamp and username for accountability.

- **Mobile-First Experience**  
  Large touch targets, optimized flows, easy for staff on the floor.

- **Easy Extension**  
  Add materials/colors/equipment via SharePoint — no app redeploy needed.

---

## 🖼️ Screens <a id="screens"></a>

<table>
  <tr>
    <td align="center">
      <img src="images/home_page.png" width="360" alt="Home Screen"><br/>
      <strong>Home</strong><br/>
      Jump to <em>Materials</em> or <em>Equipment</em> with large, accessible tiles.
    </td>
    <td align="center">
      <img src="images/materials_page.png" width="360" alt="Materials List"><br/>
      <strong>Materials List</strong><br/>
      Searchable grid of filaments with real images and manufacturers.
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/materials_quantity.png" width="360" alt="Material Colors & Quantities"><br/>
      <strong>Color Quantities</strong><br/>
      Per-color stock with +/– controls and direct edit; instant SharePoint sync.
    </td>
    <td align="center">
      <img src="images/equipments_page.png" width="360" alt="Equipment List"><br/>
      <strong>Equipment</strong><br/>
      Parts/accessories with photos, models, and quick search.
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/equipments_quantity.png" width="360" alt="Edit Equipment Quantity"><br/>
      <strong>Edit Stock</strong><br/>
      Precise updates + timestamp & last editor for auditability.
    </td>
    <td align="center">
      <img src="images/success_page.png" width="360" alt="Success Confirmation"><br/>
      <strong>Success</strong><br/>
      Clear cloud-save confirmation and shortcut navigation.
    </td>
  </tr>
</table>

---

## ⚙️ Tech Stack <a id="tech-stack"></a>
- **Front-End:** Microsoft **Power Apps (modern FX)** — responsive, touch-friendly UI  
- **Back-End:** **SharePoint Lists** (“Materials”, “Equipment”) — cloud datastore  
- **Auth:** **Microsoft 365** — secure, **role-based** access  
- **Cloud Sync:** **Azure Services** — reliable storage & realtime updates  
- **Automation:** Quantity updates, success toasts, logs (timestamp + user)  
- **Accessibility:** Desktop + mobile ready

---

## 🧭 How It Works <a id="how-it-works"></a>

### Flow at a Glance
1. **Home** → choose **Materials** or **Equipment**  
2. **List View** → search/filter; select an item  
3. **Detail** → adjust quantity via **+/–** or direct entry  
4. **Save** → instant **SharePoint** sync + **Success** confirmation  
5. **Audit** → each change logs **who**, **when**, and **what** changed

<details>
<summary><strong>Data Model</strong> (click to expand)</summary>

**SharePoint: Materials**  
- `Title` (text) — Material/brand  
- `ImageUrl` (hyperlink) — Photo  
- `Manufacturer` (text)  
- `Colors` (lookup or related list)  

**SharePoint: MaterialColors**  
- `MaterialId` (lookup → Materials)  
- `ColorName` (text)  
- `Quantity` (number)  

**SharePoint: Equipment**  
- `Title` (text) — Part/accessory  
- `ModelOrSize` (text)  
- `ImageUrl` (hyperlink)  
- `Quantity` (number)

**SharePoint: ChangeLog** (optional advanced)  
- `EntityType` (choice: Material, Color, Equipment)  
- `EntityId` (text/guid)  
- `Field` (text)  
- `OldValue` / `NewValue` (text/number)  
- `ChangedBy` (person)  
- `ChangedAt` (datetime)

</details>

---

## 🚀 Deployment <a id="deployment"></a>

1. **Provision SharePoint Lists** (as defined above).  
2. **Build the Power App (Modern FX)** with Materials/Equipment galleries and quantity edit screens.  
3. **Configure Microsoft 365 Auth** and permissions.  
4. (Optional) **Wire Azure Services / Power Automate** for telemetry and advanced automation.  
5. **Brand & Test** for accessibility and mobile.  
6. **Publish & Share** to the appropriate security groups.

---

## 📅 Project Info
- **Created by:** *Waseem Sayyedahmad*  
- **Timeline:** *01/17/2025 – 02/20/2025*  
- **Institutional Branding:** University of Houston
