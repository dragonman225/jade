import * as React from 'react'
import { iconStyle } from './icon-style'

export const IconEraser: React.FunctionComponent = () => {
  return (
    <svg className={iconStyle} width="100%" height="100%" viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M21.9854 12.181C22.3429 11.7969 22.5217 11.6048 22.5893 11.3863C22.6487 11.1939 22.6487 10.988 22.5893 10.7956C22.5217 10.577 22.3429 10.385 21.9854 10.0008L15.7096 3.2583C15.3026 2.821 15.0991 2.60235 14.8611 2.52122C14.6519 2.44993 14.425 2.44993 14.2158 2.52122C13.9778 2.60235 13.7743 2.821 13.3673 3.2583L2.01463 15.4554C1.65708 15.8395 1.47831 16.0316 1.41075 16.2501C1.35127 16.4425 1.35127 16.6484 1.41075 16.8408C1.47831 17.0593 1.65708 17.2514 2.01463 17.6356L5.60233 21.4901C5.77721 21.678 5.86466 21.7719 5.96857 21.8393C6.06067 21.8989 6.16197 21.943 6.2684 21.9698C6.38848 22 6.51682 22 6.77351 22H12.1496C12.4063 22 12.5346 22 12.6547 21.9698C12.7611 21.943 12.8624 21.8989 12.9545 21.8393C13.0584 21.7719 13.1459 21.678 13.3208 21.4901L21.9854 12.181Z" />
    </svg>
  )
}