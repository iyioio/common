import { DisposeContainer } from "@iyio/common";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";

export class Assistant{

    public readonly ctrl:ProtogenCtrl;

    public constructor(ctrl:ProtogenCtrl)
    {
        this.ctrl=ctrl;
    }


    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }

    public async generateNodesAsync(prompt:string)
    {


    }
}


// const tmpR={
//   "options": [
//     {
//       "message": {
//         "id": "XIp1-v5tRU-dUSAYuEVjQw",
//         "type": "text",
//         "role": "assistant",
//         "content": "Sure, here's a basic documentation for an application named `CatShop` designed to provide cats for sale, targeting older ladies.\n\n## CatShop: application\nAn application designed to provide a platform where elderly ladies can browse and purchase cats online.\n\n- Name: CatShop\n- Language: Javascript\n- Framework: NodeJS\n\n## User: struct sqlTable\n\nDefines a user on the platform aasdfasdf asdfasf asdfasdff fasdfasdfad fasdfasdf fasdf asdfas fdff dafdff f asdf asdf fasdf asdffasdfasdfas fasdf fa sdf asdf asdf asdf f f f f asd fas dfa sdf.\n\n- id: int\n- firstName: string\n- lastName: string\n- email: string (unique)\n- password: string\n- age: int\n- role: enum (Customer, Administrator)\n\n## Cat: struct sqlTable\n\nDefines a cat available for sale on the platform.\n\n- id: int\n- name: string\n- breed: string\n- age: int\n- price: float\n- description: string\n- image: binary\n\n## Cart: struct sqlTable\n\nDefines the shopping cart of a user.\n\n- id: int\n- userId: int \n- catId: int\n- quantity: int\n\n## Order: struct sqlTable\n\nDefines an order made by a user.\n\n- id: int\n- userId: int\n- totalAmount: float\n- createdAt: date\n- shippingStatus: enum (Pending, Shipped, Delivered)\n- paymentStatus: enum (Pending, Paid)\n\n## OrderItems: struct sqlTable\n\nDefines items within an order.\n\n- orderId: int\n- catId: int\n- price: float\n- quantity: int\n\n## SignInUser: action\n\nHandles the login functionality for users.\n\n- input: (map)\n  - email: string\n  - password: string\n  \n- output: (map)\n  - userId: int\n  - token: string\n\n## AddToCart: action\n\nHandles adding cats to the user's cart.\n\n- input: (map)\n  - userId: int\n  - catId: int\n  - quantity: int\n  \n- output: (map)\n  - successMessage: string\n\n## Checkout: action\n\nHandles the process of users placing an order.\n\n- input: (map)\n  - userId: int\n  - paymentDetails: map\n  \n- output: (map)\n  - successMessage: string\n  - orderId: int\n\nPlease note that this is a high-level overview and there are several other details that need to be defined such as server functions, event handlers, and more in a real-world scenario."
//       },
//       "confidence": 1
//     }
//   ]
// }
