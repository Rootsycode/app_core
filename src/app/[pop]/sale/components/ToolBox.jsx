import { ButtonIcon, MenuButton, MenuItem } from 'rootsy-feparts'

import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { ToolBoxSection } from '@/components/molecules/ToolBoxSection'
import { AlertIcon24 } from '@/components/atoms/icons/AlertIcon24'
import { FullScreen24 } from '@/components/atoms/icons/FullScreen24'

const Options = () => {
  return (
    <MenuButton iconButton mode='dark'>
      <MenuItem
        icon={<ProfileIcon16 />}
      >
        Ver perfil
      </MenuItem>
      <MenuItem
        icon={<HelpIcon16 />}
      >
        Ayuda
      </MenuItem>
      <MenuItem icon={<CloseSessionIcon16 />}>
        Cerrar sesión
      </MenuItem>
    </MenuButton>
  )
}

export const ToolBox = ({ sectionName }) => {
  return (
    <ToolBoxSection
      leftContent='back'
      sectionName={sectionName}
      rightContent={
        <>
          <ButtonIcon icon={<AlertIcon24 />} />
          <ButtonIcon icon={<FullScreen24 />} />
          <Options />
        </>
      }
    />
  )
}
