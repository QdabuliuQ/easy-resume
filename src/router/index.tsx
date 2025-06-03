import Loading from "@/components/loading"
import React, { JSX, lazy, ReactNode } from "react"
import { Navigate } from "react-router-dom"

const Edit = lazy(() => import("@/pages/edit"))

const withLoadingComponent = (comp: JSX.Element) => (
	<React.Suspense fallback={<Loading />}>{comp}</React.Suspense>
)

interface Router {
	name?: string
	path: string
	children?: Array<Router>
	element: ReactNode
}

const router: Array<Router> = [
	{
		path: "/",
		element: <Navigate to="/edit" />,
	},
	{
		name: "edit",
		path: "/edit",
		element: withLoadingComponent(<Edit />),
	},
]

export default router