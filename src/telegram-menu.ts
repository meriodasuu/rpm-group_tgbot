import { Keyboard } from 'grammy';

export const menuLabels = ['👤 Клиент', '📊 Отчёт'] as const;
export const managerMenu = (canManageAdmins=false) => {
 const keyboard=new Keyboard()
  .text(menuLabels[0]).text(menuLabels[1]);
 if(canManageAdmins) keyboard.row().text('👥 Админы');
 return keyboard.resized().persistent();
};
