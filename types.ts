import { SetStateAction, Dispatch } from 'react'

export interface IIconProps {
  type: string
  props: any
}

export interface IThemeContext {
  theme: any
  setTheme: Dispatch<SetStateAction<string>>
  themeName: string
}

export interface Model {
  name: string;
  label: string;
  icon: any
}

export type HomeStore = 'glendower' | 'rosebank'

export interface User {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  isAdmin: boolean
  homeStore?: HomeStore | null
}

export interface IAppContext {
  chatType: Model
  setChatType: Dispatch<SetStateAction<Model>>
  handlePresentModalPress: () => void
  setImageModel: Dispatch<SetStateAction<string>>
  imageModel: string,
  closeModal: () => void,
  currentUser: User | null
  setCurrentUser: Dispatch<SetStateAction<User | null>>
}