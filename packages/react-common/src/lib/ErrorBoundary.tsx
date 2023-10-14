import { Component, ErrorInfo } from "react";

export interface ErrorBoundaryProps
{
    onError?:(error:Error,errorInfo:ErrorInfo)=>void;
    children?:any;
    fallback?:any;
    errorClassName?:string;
}

interface ErrorBoundaryState
{
    hasError:boolean;
    error?:Error;
    errorInfo?:ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps,ErrorBoundaryState>{

    constructor(props:ErrorBoundaryProps){
        super(props);
        this.state={hasError:false};
    }

    override componentDidCatch(error:Error,errorInfo:ErrorInfo){
        const state={hasError:true,error,errorInfo};
        console.error('ErrorBoundary',state);
        this.setState(state);
        this.props.onError?.(error,errorInfo);
    }

    override render(){

        if(this.state.hasError){
            return this.props.fallback??(
                <div className={this.props.errorClassName}>
                    <h2 className={this.props.errorClassName?this.props.errorClassName+'-title':''}>
                        Error - {this.state.error?.message?.toString?.()}
                    </h2>
                    <code className={this.props.errorClassName?this.props.errorClassName+'-stack':''}>
                        <pre>{this.state.errorInfo?.componentStack}</pre>
                    </code>
                </div>
            );
        }

        return this.props.children;
    }
}
