/**
 * Icon Index - Central export file for all SVG icons
 * 
 * This file provides two ways to use icons:
 * 1. Default export: Object containing all icon URLs for use in img src, background-image, etc.
 * 2. Named exports: React components for direct use in JSX
 * 
 * Example usage:
 * - URL: <img src={icons.truck} alt="Truck" />
 * - Component: <TruckIcon className="icon" />
 */

import React from 'react';

// Import all SVG files with their default exports and ReactComponent named exports
import achievement, { ReactComponent as AchievementIconRaw } from './achievement.svg';
import alert, { ReactComponent as AlertIconRaw } from './alert.svg';
import arrow, { ReactComponent as ArrowIconRaw } from './arrow.svg';
import calendar, { ReactComponent as CalendarIconRaw } from './calendar.svg';
import clock, { ReactComponent as ClockIconRaw } from './clock.svg';
import dashboard, { ReactComponent as DashboardIconRaw } from './dashboard.svg';
import download, { ReactComponent as DownloadIconRaw } from './download.svg';
import driver, { ReactComponent as DriverIconRaw } from './driver.svg';
import edit, { ReactComponent as EditIconRaw } from './edit.svg';
import filter, { ReactComponent as FilterIconRaw } from './filter.svg';
import location, { ReactComponent as LocationIconRaw } from './location.svg';
import logout, { ReactComponent as LogoutIconRaw } from './logout.svg';
import menu, { ReactComponent as MenuIconRaw } from './menu.svg';
import money, { ReactComponent as MoneyIconRaw } from './money.svg';
import notification, { ReactComponent as NotificationIconRaw } from './notification.svg';
import phone, { ReactComponent as PhoneIconRaw } from './phone.svg';
import plus, { ReactComponent as PlusIconRaw } from './plus.svg';
import profile, { ReactComponent as ProfileIconRaw } from './profile.svg';
import search, { ReactComponent as SearchIconRaw } from './search.svg';
import settings, { ReactComponent as SettingsIconRaw } from './settings.svg';
import star, { ReactComponent as StarIconRaw } from './star.svg';
import truck, { ReactComponent as TruckIconRaw } from './truck.svg';

// Create an object with all default exports for URL usage
const icons = {
  achievement,
  alert,
  arrow,
  calendar,
  clock,
  dashboard,
  download,
  driver,
  edit,
  filter,
  location,
  logout,
  menu,
  money,
  notification,
  phone,
  plus,
  profile,
  search,
  settings,
  star,
  truck,
};

// Export the icons object as the default export
export default icons;

// Re-export all ReactComponent exports with descriptive names
export const AchievementIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = AchievementIconRaw;
export const AlertIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = AlertIconRaw;
export const ArrowIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = ArrowIconRaw;
export const CalendarIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = CalendarIconRaw;
export const ClockIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = ClockIconRaw;
export const DashboardIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = DashboardIconRaw;
export const DownloadIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = DownloadIconRaw;
export const DriverIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = DriverIconRaw;
export const EditIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = EditIconRaw;
export const FilterIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = FilterIconRaw;
export const LocationIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = LocationIconRaw;
export const LogoutIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = LogoutIconRaw;
export const MenuIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = MenuIconRaw;
export const MoneyIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = MoneyIconRaw;
export const NotificationIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = NotificationIconRaw;
export const PhoneIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = PhoneIconRaw;
export const PlusIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = PlusIconRaw;
export const ProfileIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = ProfileIconRaw;
export const SearchIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = SearchIconRaw;
export const SettingsIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = SettingsIconRaw;
export const StarIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = StarIconRaw;
export const TruckIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = TruckIconRaw;