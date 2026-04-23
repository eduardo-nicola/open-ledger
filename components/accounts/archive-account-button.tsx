'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { archiveAccount, unarchiveAccount } from '@/lib/accounts/actions'

type ArchiveAccountMenuItemProps = {
  accountId: string
  archived: boolean
}

export function ArchiveAccountMenuItem({ accountId, archived }: ArchiveAccountMenuItemProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function confirmArchive() {
    const fd = new FormData()
    fd.set('id', accountId)
    if (archived) {
      await unarchiveAccount(fd)
    } else {
      await archiveAccount(fd)
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault()
          setTimeout(() => setOpen(true), 0)
        }}
      >
        {archived ? 'Desarquivar' : 'Arquivar'}
      </DropdownMenuItem>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{archived ? 'Desarquivar conta?' : 'Arquivar conta?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {archived ?
                'A conta voltará a aparecer como ativa e entrará no saldo consolidado quando aplicável.'
              : 'A conta permanecerá na lista, mas deixará de entrar no saldo consolidado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={(e) => {
                e.preventDefault()
                void confirmArchive()
              }}
            >
              {archived ? 'Desarquivar' : 'Arquivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
